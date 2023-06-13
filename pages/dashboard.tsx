import { GetServerSidePropsContext } from "next";
import config from "../code-comp.json";
import RedirectButton from '../components/button';
import { prisma } from "../src/db";
import Table from "../components/table";

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
                            problem.difficulty <= config['difficulty-easy'] ?
                                <div className="bg-green-100 dark:bg-green-300 border border-green-400 text-green-700 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                                    Easy
                                </div>
                                :
                                problem.difficulty <= config['difficulty-medium'] ?
                                    <div className="bg-orange-100 dark:bg-orange-300 border border-orange-400 text-orange-700 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                                        Medium
                                    </div>
                                    :
                                    problem.difficulty <= config['difficulty-hard'] ?
                                        <div className="bg-red-100 dark:bg-red-300 border border-red-400 text-red-700 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                                            Hard
                                        </div>
                                        :
                                        <div className="bg-gray-100 dark:bg-gray-300 border border-purple-400 text-purple-700 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                                            Insane
                                        </div>

                        }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{problem.points}</td>
                </tr>
            ))}
        </Table>

    </>
);

export default Problems;
