import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";
import { useAuth } from "../context/AuthContext";

export default function PageLayout({ title, subtitle, actions, children }) {
  const { profileError } = useAuth();

  return (
    <div className="min-h-screen flex bg-surface text-on-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader title={title} subtitle={subtitle} actions={actions} />
        {profileError && (
          <div className="mx-gutter-mobile md:mx-gutter-desktop mt-unit-4 flex items-start gap-unit-2 p-unit-3 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span>
              Couldn't load your account data from Firestore: {profileError} If this says
              "permission-denied", your Firestore security rules likely haven't been deployed yet -
              see the README's Firebase setup section.
            </span>
          </div>
        )}
        <main className="flex-1 flex flex-col w-full pb-24 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
