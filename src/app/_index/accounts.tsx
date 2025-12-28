import { SiX } from "@icons-pack/react-simple-icons";

interface AccountsProps {
    node: React.ReactNode;
    title: string;
    id: string;
    href: string;
}

const accounts: AccountsProps[] = [
    {
        node: <SiX />,
        title: "X (@ru_milmil)",
        id: "x",
        href: "https://x.com/ru_milmil",
    },
];

export default function Accounts() {
    return (
        <div className="flex flex-col gap-2">
            {accounts.map((account) => (
                <a
                    key={account.id}
                    href={account.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                >
                    {account.node}
                    <span>{account.title}</span>
                </a>
            ))}
        </div>
    );
}
