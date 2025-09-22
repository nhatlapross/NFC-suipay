import {
    BarChart3,
    Wallet,
    Settings,
    Shield,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type ActivePage = "dashboard" | "wallet" | "contracts" | "fraud";

interface SidebarProps {
    activePage: ActivePage;
    setActivePage: (page: ActivePage) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleToggle = () => {
        const newCollapsed = !isCollapsed;
        setIsCollapsed(newCollapsed);
    };

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
        <div
            className={`${isCollapsed ? "w-16" : "w-64"} bg-black text-white ${
                isCollapsed ? "p-2" : "p-6"
            } border-r-4 border-black transition-all duration-300 ease-in-out relative`}
        >
            <div className={`${isCollapsed ? "mb-6" : "mb-12"}`}>
                <div
                    className={`flex items-center ${
                        isCollapsed ? "justify-center" : "gap-3"
                    } ${isCollapsed ? "mb-0" : "mb-2"}`}
                >
                    <Image
                        src="/panda.png"
                        alt="Admin Logo"
                        width={isCollapsed ? 24 : 32}
                        height={isCollapsed ? 24 : 32}
                        className="text-[#FF005C]"
                    />
                    {!isCollapsed && (
                        <>
                            <h1 className="text-xl font-bold text-[#00F0FF]">
                                ADMIN
                            </h1>
                        </>
                    )}
                </div>
                {!isCollapsed && (
                    <div className="text-sm text-gray-300">CONTROL PANEL</div>
                )}
            </div>

            <nav className={`${isCollapsed ? "space-y-2" : "space-y-4"}`}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`w-full flex items-center ${
                                isCollapsed ? "justify-center" : "gap-3"
                            } ${
                                isCollapsed ? "p-2" : "p-4"
                            } text-left font-bold border-2 border-black transition-all ${
                                isActive
                                    ? "bg-[#FF005C] text-white shadow-[4px_4px_0_black]"
                                    : "bg-white text-black hover:bg-[#00F0FF] hover:shadow-[4px_4px_0_black]"
                            }`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon
                                className={`${
                                    isCollapsed ? "w-4 h-4" : "w-5 h-5"
                                } flex-shrink-0`}
                            />
                            {!isCollapsed && item.label}
                        </button>
                    );
                })}
            </nav>

            {!isCollapsed && (
                <div className="mt-12 p-4 bg-[#00F0FF] border-2 border-black text-black">
                    <div className="text-sm font-bold">SYSTEM STATUS</div>
                    <div className="text-xs mt-1">ALL SYSTEMS OPERATIONAL</div>
                    <div className="w-full h-2 bg-black mt-2">
                        <div className="w-full h-full bg-[#FF005C]"></div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={handleToggle}
                className={`absolute ${
                    isCollapsed ? "top-2 -right-3" : "top-4 right-4"
                } ${
                    isCollapsed ? "p-1" : "p-2"
                } bg-[#00F0FF] text-black border-2 border-black hover:bg-[#FF005C] hover:text-white transition-all duration-200`}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                ) : (
                    <ChevronLeft className="w-4 h-4" />
                )}
            </button>
        </div>
    );
};

export default Sidebar;
