import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";

export default function PageLayout({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen flex bg-surface text-on-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 flex flex-col w-full pb-24 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
