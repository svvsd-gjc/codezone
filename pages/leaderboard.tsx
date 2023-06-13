import { GetServerSidePropsContext } from 'next';
import RedirectButton from '../components/button';
import { prisma } from "../src/db";
import Table from '../components/table';

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

// converts a given team to it's table entries, for use creating leaderboards
function teamToTableBody(t: any[]) {
    return t.map(account => (
        <tr key={account.id}>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <RedirectButton href={"/profile/" + account.id + "/"}>
                        {account.name}
                    </RedirectButton>
                </div>
            </td>
            <td className="px-6 py-4 dark:text-white whitespace-nowrap">
                {account.points}
            </td>
        </tr>
    ));
}

const Leaderboard = ({ team0, team1 }: { team0: any[], team1: any[] }) => (
    <>

        {/* TODO code reuse, could extract to function */}

        <h1 className="p-4 text-xl dark:text-white">Beginner</h1>
        <Table headers={["Name", "Points"]}>
            {teamToTableBody(team0)}
        </Table>

        <h1 className="p-4 text-xl dark:text-white">Advanced</h1>
        <Table headers={["Name", "Points"]}>
            {teamToTableBody(team1)}
        </Table>

    </>
);

export default Leaderboard;
