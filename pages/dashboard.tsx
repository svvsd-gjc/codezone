import { GetServerSidePropsContext } from "next";
import RedirectButton from '../components/button';
import { prisma } from "../src/db";
import Table from "../components/table";
import DifficultyBadge from "../components/difficulty_badge";

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    // This will load server-side assets like problems, user profiles, and leaderboard
    const problems = await prisma.problem.findMany({
        orderBy: {
            name: 'asc'
        },
        select: {
            id: true,
            name: true,
            points: true,
            difficulty: true,
            description: true,
        }
    });
    return {
        props: { problems }
    };
}

const Problems = ({ problems }: { problems: any[] }) => (
    <>

        <Table headers={["Name", "Description", "Difficulty", "Points"]}>
            {/* Map problems to table rows */}
            {problems.map(problem => (
                <tr key={problem.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="ml-4">
                                <RedirectButton href={"/problem/" + problem.id + "/?ctx=none"}>{problem.name}</RedirectButton>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
                        {
                            (problem.description.length > 25) ? problem.description.substring(0, 25) + "..." : problem.description
                        }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {
                            DifficultyBadge(problem)

                        }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{problem.points}</td>
                </tr>
            ))}
        </Table>

    </>
);

export default Problems;
