import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  model: string;
}

interface SidebarProps {
  agents: Agent[];
}

export function Sidebar({ agents }: SidebarProps) {
  return (
    <aside className="w-64 border-r h-screen flex flex-col">
      <div className="p-4 border-b font-bold text-lg">Pinchy</div>

      <nav className="flex-1 p-2">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/chat/${agent.id}`}
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
          >
            <span>🤖</span>
            <span>{agent.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-2 border-t">
        <Link
          href="/settings"
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
        >
          Settings
        </Link>
      </div>
    </aside>
  );
}
