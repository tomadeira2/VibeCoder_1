import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Welcome to Padel Tournament Manager</h1>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Link href="/players" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600">Players</h2>
          <p className="text-gray-600 dark:text-gray-300">Register new players and view profiles with statistics</p>
        </Link>

        <Link href="/tournaments" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600">Tournaments</h2>
          <p className="text-gray-600 dark:text-gray-300">Create and manage tournaments with round robin and knockout stages</p>
        </Link>

        <Link href="/rankings" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600">Rankings</h2>
          <p className="text-gray-600 dark:text-gray-300">View global player rankings based on tournament performance</p>
        </Link>
      </div>
    </div>
  );
}
