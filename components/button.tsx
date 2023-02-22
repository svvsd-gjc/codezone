import { useRouter } from 'next/router';

function RedirectButton({ children, href, onClick }: { children: any, href?: string, onClick?: Function }) {
    const router = useRouter();

    const handleClick = (e: any) => {
        if (onClick) {
            onClick();
        }
        e.preventDefault();
        router.push(href ?? "");
    };

    return (
        <button className="px-2 hover:scale-110 transition-all" onClick={handleClick}>
            <span className={`px-2 rounded transition-all shadow-md bg-blue-400 shadow-cyan-800/50 hover:bg-blue-600 hover:text-white`}>
                {children}
            </span>
        </button>
    );
}

export default RedirectButton;