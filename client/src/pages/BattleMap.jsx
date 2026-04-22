import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { timeAgo } from '../lib/format.js';

const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const EARTH_TEXTURE = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';
const GLOBE_RADIUS = 100;

const STAGE_COLOR = {
  'Uncontacted':    '#374151',
  'Researched':     '#64748b',
  'Reached Out':    '#f59e0b',
  'Meeting Booked': '#22c55e',
  'Active':         '#3b82f6',
  'Closed Won':     '#22c55e',
  'Deployed':       '#3b82f6'
};

const LEGEND_STAGES = ['Uncontacted', 'Researched', 'Reached Out', 'Meeting Booked', 'Active', 'Deployed'];

const HUBS = {
  US: { name: 'San Francisco', lat: 37.77, lng: -122.42 },
  UK: { name: 'London',        lat: 51.51, lng: -0.13 }
};

const TERRITORIES = ['All', 'US', 'UK', 'DACH', 'Israel'];

function dotRadiusForHeadcount(n) {
  if (!n || n < 1000) return 0.8;
  if (n < 5000) return 1.2;
  if (n < 15000) return 1.8;
  return 2.4;
}

function displayStage(a) {
  return a.deployed ? 'Deployed' : (a.stage || 'Uncontacted');
}

function latLngToVec3(THREE, lat, lng, radius = GLOBE_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
}

function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${THREE_SRC}"]`);
    if (existing) {
      if (window.THREE) return resolve(window.THREE);
      let settled = false;
      existing.addEventListener('load', () => { settled = true; resolve(window.THREE); });
      existing.addEventListener('error', (e) => { settled = true; reject(e); });
      // If the existing script already finished before we attached listeners,
      // neither load nor error will fire. Poll briefly, then give up.
      const start = Date.now();
      const poll = setInterval(() => {
        if (settled) { clearInterval(poll); return; }
        if (window.THREE) { clearInterval(poll); settled = true; resolve(window.THREE); return; }
        if (Date.now() - start > 5000) {
          clearInterval(poll);
          settled = true;
          reject(new Error('Three.js script present but window.THREE never initialised'));
        }
      }, 100);
      return;
    }
    const s = document.createElement('script');
    s.src = THREE_SRC;
    s.async = true;
    s.onload = () => resolve(window.THREE);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function BattleMap({ navigate }) {
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const stateRef = useRef(null);
  const [accounts, setAccounts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [deployedOnly, setDeployedOnly] = useState(false);
  const [territory, setTerritory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sceneReady, setSceneReady] = useState(false);

  // Fetch data
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [a, act] = await Promise.all([
          api.get('/accounts'),
          api.get('/activities?limit=30').catch(() => [])
        ]);
        if (!alive) return;
        setAccounts(Array.isArray(a) ? a : []);
        setActivities(Array.isArray(act) ? act : []);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const visibleAccounts = useMemo(() => {
    return accounts.filter((a) => {
      if (a.lat == null || a.lng == null) return false;
      if (deployedOnly && !a.deployed) return false;
      if (territory !== 'All' && a.territory !== territory) return false;
      return true;
    });
  }, [accounts, deployedOnly, territory]);

  // Three.js scene setup + lifecycle
  useEffect(() => {
    if (!accounts.length) return;
    let disposed = false;
    let rafId = null;

    loadThree().then((THREE) => {
      if (disposed || !containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
      camera.position.set(0, 0, 260);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x05070f, 1);
      container.appendChild(renderer.domElement);

      // Starfield (2000 points)
      const starGeom = new THREE.BufferGeometry();
      const starPositions = new Float32Array(2000 * 3);
      for (let i = 0; i < 2000; i += 1) {
        const r = 900 + Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = r * Math.cos(phi);
      }
      starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const stars = new THREE.Points(
        starGeom,
        new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true, transparent: true, opacity: 0.8 })
      );
      scene.add(stars);

      // Globe group (everything earth-related lives here so we rotate one node)
      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      const earthMat = new THREE.MeshBasicMaterial({ color: 0x0a1128 });
      const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64), earthMat);
      globeGroup.add(earthMesh);
      loader.load(EARTH_TEXTURE, (tex) => {
        earthMat.map = tex;
        earthMat.color = new THREE.Color(0xffffff);
        earthMat.needsUpdate = true;
      });

      // Atmosphere glow
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(GLOBE_RADIUS * 1.08, 64, 64),
        new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, side: THREE.BackSide })
      );
      scene.add(atmosphere);

      // Arc lines from hub to regional accounts
      const arcsGroup = new THREE.Group();
      const arcMat = new THREE.MeshBasicMaterial({ color: 0x1d4ed8, transparent: true, opacity: 0.15 });
      function addArc(fromLat, fromLng, toLat, toLng) {
        const v1 = latLngToVec3(THREE, fromLat, fromLng);
        const v2 = latLngToVec3(THREE, toLat, toLng);
        const mid = v1.clone().add(v2).multiplyScalar(0.5);
        mid.setLength(GLOBE_RADIUS * 1.5);
        const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.25, 8, false), arcMat);
        arcsGroup.add(tube);
      }
      for (const a of accounts) {
        if (a.lat == null || a.lng == null) continue;
        if (a.territory === 'US') addArc(HUBS.US.lat, HUBS.US.lng, a.lat, a.lng);
        if (a.territory === 'UK') addArc(HUBS.UK.lat, HUBS.UK.lng, a.lat, a.lng);
      }
      globeGroup.add(arcsGroup);

      // Account dots
      const dotsGroup = new THREE.Group();
      globeGroup.add(dotsGroup);
      const dotRecords = [];
      const baseMaterials = {};
      function matFor(stage) {
        if (!baseMaterials[stage]) {
          baseMaterials[stage] = new THREE.MeshBasicMaterial({ color: new THREE.Color(STAGE_COLOR[stage] || '#64748b') });
        }
        return baseMaterials[stage];
      }

      for (const a of accounts) {
        if (a.lat == null || a.lng == null) continue;
        const stage = displayStage(a);
        const color = STAGE_COLOR[stage] || '#64748b';
        const baseR = dotRadiusForHeadcount(a.eng_headcount);
        const pos = latLngToVec3(THREE, a.lat, a.lng, GLOBE_RADIUS + 0.6);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(baseR, 16, 16), matFor(stage));
        dot.position.copy(pos);
        dot.userData = { account: a, stage };
        dotsGroup.add(dot);

        let halo = null;
        if (stage === 'Active' || stage === 'Deployed') {
          halo = new THREE.Mesh(
            new THREE.SphereGeometry(baseR * 2.2, 16, 16),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
          );
          halo.position.copy(pos);
          dotsGroup.add(halo);
        }

        let ring = null;
        if (stage === 'Deployed') {
          ring = new THREE.Mesh(
            new THREE.RingGeometry(0.4, 0.6, 48),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, side: THREE.DoubleSide })
          );
          ring.position.copy(pos);
          ring.userData.phaseOffset = Math.random() * Math.PI * 2;
          dotsGroup.add(ring);
        }

        dotRecords.push({ account: a, dot, halo, ring, basePos: pos.clone(), baseRadius: baseR, stage });
      }

      // Mouse drag controls
      const drag = { down: false, lastX: 0, lastY: 0 };
      const onDown = (e) => { drag.down = true; drag.lastX = e.clientX; drag.lastY = e.clientY; autoRotate.current = false; };
      const onUp = () => { drag.down = false; };
      const onMove = (e) => {
        if (drag.down) {
          const dx = e.clientX - drag.lastX;
          const dy = e.clientY - drag.lastY;
          drag.lastX = e.clientX;
          drag.lastY = e.clientY;
          globeGroup.rotation.y += dx * 0.005;
          globeGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globeGroup.rotation.x + dy * 0.005));
          targetRotation.current = null; // cancel in-flight lerp
        }
        // update hover
        const rect2 = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect2.left) / rect2.width) * 2 - 1;
        mouse.y = -((e.clientY - rect2.top) / rect2.height) * 2 + 1;
        mouseClient.x = e.clientX;
        mouseClient.y = e.clientY;
      };
      const onWheel = (e) => {
        e.preventDefault();
        const next = camera.position.z + e.deltaY * 0.2;
        camera.position.z = Math.max(150, Math.min(400, next));
      };

      renderer.domElement.addEventListener('mousedown', onDown);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('mousemove', onMove);
      renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

      // Raycasting
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(-2, -2);
      const mouseClient = { x: 0, y: 0 };
      let hovered = null;

      const onClick = (e) => {
        const rect2 = renderer.domElement.getBoundingClientRect();
        const cx = ((e.clientX - rect2.left) / rect2.width) * 2 - 1;
        const cy = -((e.clientY - rect2.top) / rect2.height) * 2 + 1;
        raycaster.setFromCamera({ x: cx, y: cy }, camera);
        const intersects = raycaster.intersectObjects(dotsGroup.children, false);
        for (const hit of intersects) {
          const acct = hit.object.userData?.account;
          if (acct) {
            setSelected(acct);
            // lerp globe.rotation.y so the dot faces camera (positive Z)
            const targetY = Math.atan2(hit.object.position.x, hit.object.position.z);
            targetRotation.current = -targetY;
            break;
          }
        }
      };
      renderer.domElement.addEventListener('click', onClick);

      // Animation loop refs (so other handlers can read them)
      const autoRotate = { current: true };
      const targetRotation = { current: null }; // target rotation.y to lerp toward
      let lerpFrames = 0;

      function animate(time) {
        rafId = requestAnimationFrame(animate);
        const t = time / 1000;

        if (autoRotate.current && !drag.down && targetRotation.current === null) {
          globeGroup.rotation.y += 0.002;
        }

        // Lerp to target rotation
        if (targetRotation.current !== null) {
          const from = globeGroup.rotation.y;
          const to = targetRotation.current;
          // shortest-path delta
          let d = (to - from) % (Math.PI * 2);
          if (d > Math.PI) d -= Math.PI * 2;
          if (d < -Math.PI) d += Math.PI * 2;
          globeGroup.rotation.y += d * 0.06;
          lerpFrames += 1;
          if (Math.abs(d) < 0.002 || lerpFrames > 90) {
            targetRotation.current = null;
            lerpFrames = 0;
          }
        }

        // Pulse halos
        for (const r of dotRecords) {
          if (r.halo) {
            const s = 1 + Math.sin(t * 2 + (r.basePos.x + r.basePos.y)) * 0.3;
            r.halo.scale.setScalar(s);
            r.halo.material.opacity = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin(t * 2));
          }
          if (r.ring) {
            // scale 0→4 and fade 1→0 over 2s
            const phase = ((t + r.ring.userData.phaseOffset) % 2) / 2;
            r.ring.scale.setScalar(0.1 + phase * 8);
            r.ring.material.opacity = 1 - phase;
            r.ring.lookAt(camera.position);
          }
        }

        // Hover raycast
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(dotsGroup.children, false);
        const hit = hits[0];
        const acct = hit?.object?.userData?.account || null;
        if (acct !== hovered) {
          hovered = acct;
          const tip = tooltipRef.current;
          if (tip) {
            if (acct) {
              tip.style.display = 'block';
              const stage = displayStage(acct);
              tip.innerHTML =
                `<div class="text-[10px] font-mono uppercase tracking-widest text-slate-400">${escapeHtml(acct.territory || '')} · ${escapeHtml(acct.industry || '')}</div>` +
                `<div class="mt-0.5 text-sm font-semibold text-white">${escapeHtml(acct.name)}</div>` +
                `<div class="mt-1 text-xs text-slate-300">${formatInt(acct.eng_headcount)} engineers</div>` +
                `<div class="mt-1 flex items-center gap-1.5 text-xs text-slate-200"><span style="background:${STAGE_COLOR[stage]};width:8px;height:8px;border-radius:999px;display:inline-block"></span>${escapeHtml(stage)}</div>` +
                `<div class="mt-0.5 text-[11px] text-slate-400">ICP ${acct.icp_score ?? '—'}/10</div>`;
            } else {
              tip.style.display = 'none';
            }
          }
        }
        if (tooltipRef.current && hovered) {
          tooltipRef.current.style.left = `${mouseClient.x + 14}px`;
          tooltipRef.current.style.top = `${mouseClient.y + 14}px`;
        }

        renderer.render(scene, camera);
      }
      rafId = requestAnimationFrame(animate);

      // Resize
      function onResize() {
        if (!containerRef.current) return;
        const r = containerRef.current.getBoundingClientRect();
        const w = Math.max(r.width, 1);
        const h = Math.max(r.height, 1);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      window.addEventListener('resize', onResize);

      stateRef.current = {
        THREE, scene, camera, renderer, globeGroup, dotsGroup, dotRecords, autoRotate, targetRotation,
        latLngToVec3: (lat, lng) => latLngToVec3(THREE, lat, lng),
        dispose: () => {
          cancelAnimationFrame(rafId);
          window.removeEventListener('resize', onResize);
          window.removeEventListener('mouseup', onUp);
          window.removeEventListener('mousemove', onMove);
          renderer.domElement.removeEventListener('mousedown', onDown);
          renderer.domElement.removeEventListener('wheel', onWheel);
          renderer.domElement.removeEventListener('click', onClick);
          if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
          renderer.dispose();
        }
      };
      if (!disposed) setSceneReady(true);
    }).catch((e) => {
      if (!disposed) setError(e);
    });

    return () => {
      disposed = true;
      setSceneReady(false);
      if (rafId) cancelAnimationFrame(rafId);
      if (stateRef.current?.dispose) stateRef.current.dispose();
      stateRef.current = null;
    };
  }, [accounts]);

  // Hide/show dots based on filter without rebuilding scene. Depends on
  // sceneReady so that it re-runs once the async Three.js setup completes.
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const visibleNames = new Set(visibleAccounts.map((a) => a.name));
    for (const r of s.dotRecords) {
      const v = visibleNames.has(r.account.name);
      r.dot.visible = v;
      if (r.halo) r.halo.visible = v;
      if (r.ring) r.ring.visible = v;
    }
  }, [visibleAccounts, sceneReady]);

  // Rotate to selected account (clicked from sidebar list) — reuse lerp
  function focusAccount(a) {
    setSelected(a);
    const s = stateRef.current;
    if (!s || a.lat == null || a.lng == null) return;
    const v = s.latLngToVec3(a.lat, a.lng);
    s.targetRotation.current = -Math.atan2(v.x, v.z);
  }

  const deployedCount = accounts.filter((a) => a.deployed).length;

  const tickerItems = useMemo(() => {
    const statics = [
      { html: '<span class="text-electric">●</span> GOLDMAN SACHS · DEVIN DEPLOYED IN-VPC · 3-4X VELOCITY · NEW YORK' },
      { html: '<span class="text-electric">●</span> NUBANK · DEVIN DEPLOYED · 12X ETL EFFICIENCY · SÃO PAULO' }
    ];
    const fromActivities = (activities || []).slice(0, 30).map((act) => {
      const account = accounts.find((a) => a.id === act.account_id);
      const name = account?.name || 'COGNITION';
      const loc = account?.territory || '';
      return { html: `${escapeHtml(name.toUpperCase())} · ${escapeHtml((act.description || act.type || '').toUpperCase())} · ${escapeHtml(timeAgo(act.created_at).toUpperCase())}${loc ? ` · ${escapeHtml(loc.toUpperCase())}` : ''}` };
    });
    return [...statics, ...fromActivities];
  }, [activities, accounts]);

  return (
    <div className="battle-map-shell">
      <div className="flex h-[calc(100vh-140px)] min-h-[600px] overflow-hidden rounded-xl border border-navy-600 bg-navy-800/40">
        {/* Sidebar */}
        <aside className="flex w-[280px] flex-col border-r border-navy-600 bg-navy-800/80">
          <div className="border-b border-navy-600 px-4 py-4">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-slate-300">
              <span className="live-dot h-2 w-2 rounded-full bg-green-500" />
              Global Battle Map
            </div>
            <div className="mt-1 text-xs text-slate-500">Live GTM footprint</div>
          </div>

          <div className="space-y-4 border-b border-navy-600 px-4 py-4">
            <div>
              <div className="section-title mb-2">View</div>
              <div className="flex rounded-md border border-navy-600 bg-navy-700/60 p-0.5 text-xs">
                <button
                  onClick={() => setDeployedOnly(false)}
                  className={`flex-1 rounded px-2 py-1 transition-colors ${!deployedOnly ? 'bg-electric text-white' : 'text-slate-300 hover:text-white'}`}
                >All Accounts</button>
                <button
                  onClick={() => setDeployedOnly(true)}
                  className={`flex-1 rounded px-2 py-1 transition-colors ${deployedOnly ? 'bg-electric text-white' : 'text-slate-300 hover:text-white'}`}
                >Deployed Only</button>
              </div>
            </div>

            <div>
              <div className="section-title mb-2">Territory</div>
              <div className="flex flex-wrap gap-1.5">
                {TERRITORIES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTerritory(t)}
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                      territory === t
                        ? 'border-electric bg-electric/15 text-electric'
                        : 'border-navy-500 bg-navy-700/60 text-slate-300 hover:border-electric hover:text-white'
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-b border-navy-600 px-4 py-4">
            <div className="section-title">Legend</div>
            {LEGEND_STAGES.map((s) => (
              <div key={s} className="flex items-center gap-2 text-xs text-slate-300">
                <span style={{ background: STAGE_COLOR[s] }} className="inline-block h-2.5 w-2.5 rounded-full" />
                <span>{s}</span>
              </div>
            ))}
          </div>

          <div className="border-b border-navy-600 px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-slate-400">
            <span className="text-white">{visibleAccounts.length}</span> accounts · <span className="text-electric">{deployedCount}</span> deployed
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="section-title mb-2">Selected</div>
            {!selected ? (
              <div className="rounded-lg border border-dashed border-navy-600 bg-navy-900/40 px-3 py-6 text-center text-xs text-slate-500">
                Click any account on the map
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{selected.name}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{selected.territory} · {selected.industry}</div>
                  </div>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest" style={{ background: `${STAGE_COLOR[displayStage(selected)]}22`, color: STAGE_COLOR[displayStage(selected)], border: `1px solid ${STAGE_COLOR[displayStage(selected)]}55` }}>
                    {displayStage(selected)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {formatInt(selected.eng_headcount)} engineers · ICP {selected.icp_score ?? '—'}/10
                </div>
                {selected.pain_point ? (
                  <div className="text-xs leading-snug text-slate-300 line-clamp-3">{selected.pain_point}</div>
                ) : null}
                {selected.primary_contact ? (
                  <div className="rounded-md border border-navy-600 bg-navy-900/60 px-2.5 py-2">
                    <div className="text-xs font-medium text-white">{selected.primary_contact}</div>
                    <div className="text-[11px] text-slate-500">Primary contact</div>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate && navigate('accounts', String(selected.id))}
                    className="btn-primary text-xs"
                  >View Account →</button>
                  <button
                    onClick={() => navigate && navigate('outreach', `compose=${selected.id}`)}
                    className="btn-outline text-xs"
                  >Log Reach Out</button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Globe canvas */}
        <div className="relative flex-1">
          <div ref={containerRef} className="absolute inset-0" />
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-slate-400">loading globe…</div>
          ) : null}
          {error ? (
            <div className="absolute inset-x-6 top-6 rounded-md border border-red-800 bg-red-900/40 px-3 py-2 text-xs text-red-200">
              Failed to load globe: {String(error.message || error)}
            </div>
          ) : null}
        </div>
      </div>

      {/* Ticker */}
      <div className="mt-3 overflow-hidden rounded-md border border-navy-600 bg-navy-900/80">
        <div className="battle-ticker-track font-mono text-[12px] uppercase tracking-wider text-slate-300">
          {[0, 1].map((copy) => (
            <div key={copy} className="battle-ticker-copy">
              {tickerItems.map((item, i) => (
                <span key={`${copy}-${i}`} className="battle-ticker-item" dangerouslySetInnerHTML={{ __html: item.html }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-50 hidden rounded-md border border-navy-500 bg-navy-900/95 px-3 py-2 shadow-xl backdrop-blur"
        style={{ left: -9999, top: -9999, minWidth: 180 }}
      />
    </div>
  );
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function formatInt(n) {
  if (!n && n !== 0) return '—';
  return Number(n).toLocaleString('en-US');
}
