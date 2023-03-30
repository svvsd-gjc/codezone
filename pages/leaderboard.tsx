import { GetServerSidePropsContext } from 'next';
import RedirectButton from '../components/button';
import { prisma } from "../src/db";

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    // This will load server-side users, ordered by points
    const team0 = await prisma.user.findMany({
        orderBy: {
            points: 'desc'
        },
        where: {
            team: 0
        },
        select: {
            id: true,
            name: true,
            points: true,
        }
    });
    const team1 = await prisma.user.findMany({
        orderBy: {
            points: 'desc'
        },
        where: {
            team: 1
        },
        select: {
            id: true,
            name: true,
            points: true,
        }
    });
    return {
        props: { team0, team1 }
    };
}

const Leaderboard = ({ team0, team1 }: { team0: any[], team1: any[] }) => (
    <>

        {/* Server-loaded problem table */}

        <h1 className="p-4 text-xl dark:text-white">Beginner</h1>
        <div className="flex flex-col p-4">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-500 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-500 shadow-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 content dark:bg-gray-600 dark:divide-gray-500 dark:text-white">

                                {/* Map problems to table rows */}
                                {team0.map(account => (
                                    <tr key={account.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <RedirectButton href={"/profile/" + account.id + "/"}>
                                                    {account.name}
                                                </RedirectButton>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {account.points}
                                        </td>
                                    </tr>
                                ))}

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <h1 className="p-4 text-xl dark:text-white">Advanced</h1>
        <div className="flex flex-col p-4">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-500 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-500 shadow-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 content dark:bg-gray-600 dark:divide-gray-500 dark:text-white">

                                {/* Map problems to table rows */}
                                {team1.map(account => (
                                    <tr key={account.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <RedirectButton href={"/profile/" + account.id + "/"}>
                                                    {account.name}
                                                </RedirectButton>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {account.points}
                                        </td>
                                    </tr>
                                ))}

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

    </>
);

export default Leaderboard;
