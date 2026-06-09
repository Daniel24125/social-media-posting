import { createFirstWorkspace } from './actions';

export default function OnboardingPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let's get started by creating your first project workspace.
          </p>
        </div>
        
        <form action={createFirstWorkspace} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="e.g. SUNRISE"
              className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Workspace
          </button>
        </form>
      </div>
    </div>
  );
}
