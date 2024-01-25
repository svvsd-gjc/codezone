import { GetServerSidePropsContext } from "next";
import { prisma } from "../../src/db";

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const query = ctx.query;
    const user = await prisma.user.findUnique({
        where: {
            id: query.u?.toString()
        },
        select: {
            name: true,
            team: true,
            organizer: true,
            solved_problems: {
                select: {
                    name: true,
                    difficulty: true,
                },
                orderBy: {
                    name: "asc",
                }
            },
            points: true
        }
    });
    return {
        props: {
            data: user
        }
    };
}

const Profile = ({ data }: { data: any }) => (
    <div className="m-4 rounded bg-gray-200 dark:bg-gray-600">
        {/* TODO make prettier. could also add more information, team info instead of id, etc, etc */}
        <span className="inline-block m-3 px-2 rounded text-5xl font-bold bg-blue-400">{data.name}</span>
        <span className="float-right m-3 px-2 rounded text-4xl font-bold bg-blue-300">team {data.team}</span>
        <span className="float-right m-3 px-2 rounded text-4xl font-bold bg-blue-300">{data.points} point(s)</span>
        {
            data.organizer ? <span className="float-right m-3 px-2 rounded text-4xl font-bold bg-blue-300">organizer</span> : null
        }
        <br></br>
        {
            data.solved_problems.map((item: any) => (
                <>
                    <div className="inline-block px-2 m-2 text-3xl bg-green-200 hover:bg-green-400 transition rounded" key={item.id}>
                        <span className="text-gray-400">+ </span>
                        {item.name} ({item.difficulty} difficulty)
                    </div>
                    <br></br>
                </>
            ))
        }
    </div>
);

export default Profile;
