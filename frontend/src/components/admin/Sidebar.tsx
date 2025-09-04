import {
    BarChart3,
    Wallet,
    Settings,
    Shield,
    AlertTriangle,
} from "lucide-react";

type ActivePage = "dashboard" | "wallet" | "contracts" | "fraud";

interface SidebarProps {
    activePage: ActivePage;
    setActivePage: (page: ActivePage) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
    const menuItems = [
        { id: "dashboard" as ActivePage, label: "DASHBOARD", icon: BarChart3 },
        { id: "wallet" as ActivePage, label: "WALLET MGMT", icon: Wallet },
        {
            id: "contracts" as ActivePage,
            label: "SMART CONTRACT",
            icon: Settings,
        },
        { id: "fraud" as ActivePage, label: "FRAUD MONITOR", icon: Shield },
    ];

    return (
        <div className="w-64 bg-black text-white p-6 border-r-4 border-black">
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-8 h-8 text-[#FF005C]" />
                    <h1 className="text-xl font-bold text-[#00F0FF]">ADMIN</h1>
                </div>
                <div className="text-sm text-gray-300">CONTROL PANEL</div>
            </div>

            <nav className="space-y-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`w-full flex items-center gap-3 p-4 text-left font-bold border-2 border-black transition-all ${
                                isActive
                                    ? "bg-[#FF005C] text-white shadow-[4px_4px_0_black]"
                                    : "bg-white text-black hover:bg-[#00F0FF] hover:shadow-[4px_4px_0_black]"
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="mt-12 p-4 bg-[#00F0FF] border-2 border-black text-black">
                <div className="text-sm font-bold">SYSTEM STATUS</div>
                <div className="text-xs mt-1">ALL SYSTEMS OPERATIONAL</div>
                <div className="w-full h-2 bg-black mt-2">
                    <div className="w-full h-full bg-[#FF005C]"></div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
