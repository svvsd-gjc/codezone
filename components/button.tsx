import { useRouter } from 'next/router';

function RedirectButton({ children, href, onClick }: { children: any, href?: string, onClick?: Function }) {
    const router = useRouter();

    const handleClick = (e) => {
        if (onClick) {
            onClick();
        }
        e.preventDefault();
        router.push(href);
    };

    return (
        <button className="px-2" onClick={handleClick}>
            <span className={`px-2 rounded transition-all shadow-md bg-blue-400 shadow-cyan-800/50 hover:bg-blue-500`}>
                {children}
            </span>
        </button>
    );
}

export default RedirectButton;