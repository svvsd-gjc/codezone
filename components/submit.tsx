import { useSession } from "next-auth/react";

function Submit() {
    const session = useSession();
    if (session.status == "authenticated") {
        return (<button type="submit" className="rounded bg-blue-200 px-4 dark:bg-blue-600 dark:text-white">Submit</button>);
    } else {
        return (<button type="submit" className="rounded bg-gray-200 px-4 dark:bg-gray-500 dark:text-white" disabled>Please log in.</button>);
    }
}

export default Submit;