import React, { useEffect, useState } from 'react';
import { TopNav } from './components/TopNav.jsx';
import Command from './pages/Command.jsx';
import Accounts from './pages/Accounts.jsx';
import Outreach from './pages/Outreach.jsx';
import Intelligence from './pages/Intelligence.jsx';
import Competition from './pages/Competition.jsx';
import BattleMap from './pages/BattleMap.jsx';
import SalesKit from './pages/SalesKit.jsx';

const SECTIONS = {
  command: { label: 'Command', component: Command },
  accounts: { label: 'Accounts', component: Accounts },
  outreach: { label: 'Outreach', component: Outreach },
  intelligence: { label: 'Intelligence', component: Intelligence },
  competition: { label: 'Competition', component: Competition },
  battleMap: { label: 'Battle Map', component: BattleMap },
  salesKit: { label: 'Sales Kit', component: SalesKit }
};

function readHash() {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [section, ...rest] = h.split('/');
  return { section: SECTIONS[section] ? section : 'command', param: rest.join('/') };
}

export default function App() {
  const [route, setRoute] = useState(readHash());

  useEffect(() => {
    function onHash() { setRoute(readHash()); }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function navigate(section, param) {
    window.location.hash = param ? `#/${section}/${param}` : `#/${section}`;
  }

  const Component = SECTIONS[route.section].component;

  return (
    <div className="min-h-full">
      <TopNav current={route.section} onNavigate={navigate} />
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <Component param={route.param} navigate={navigate} />
      </main>
      <footer className="mx-auto max-w-[1600px] px-6 pb-6 pt-2 text-center font-mono text-[10px] uppercase tracking-widest text-slate-500">
        Directed by Idel · Executed by Devin
      </footer>
    </div>
  );
}
