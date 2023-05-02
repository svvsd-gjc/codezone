import { GetServerSidePropsContext } from 'next';
import { useSession } from 'next-auth/react';
import React from 'react';
import Submit from "../../components/submit";
import { prisma } from "../../src/db";

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const query = ctx.query;
    const problem = await prisma.problem.findUnique({
        where: {
            id: query.pid?.toString(),
        },
        select: {
            id: true,
            name: true,
            description: true,
            points: true,
            difficulty: true,
            example_cases: true,
        }
    });
    return {
        props: {
            problem,
            id: query.pid,
            context: query.ctx,
        }
    };
}

const Problem = ({ problem, id, context }: { problem: any, id: number, context: any }) => {

    const session = useSession();

    const example_cases = problem.example_cases;

    return (
        <>
            <div className="p-3">
                {problem_info()}
                {problem_dashboard()}
            </div>
        </>
    );

    function problem_dashboard() {
        return <div className="flex mb-4 pt-4 text-xl">
            <div className="flex-1 bg-gray-50">
                <div className="font-extrabold">description</div>
                {problem.description}
            </div>
            <div className="flex-1 bg-gray-100">
                {/* render example case so the user can see what they'll be graded for */}
                <div className="font-extrabold">example inputs</div>
                {example_cases.case0.inputs.map((_in: any, index: number) => (<span key={index}>{example_cases.case0.inputs[index]}<br /></span>))}
                <div className="font-extrabold">example outputs</div>
                {example_cases.case0.outputs.map((_out: any, index: number) => (<span key={index}>{example_cases.case0.outputs[index]}<br /></span>))}
            </div>
            <div className="flex-1 bg-gray-50">
                <div className="font-extrabold">submit</div>
                {/* fancy multer form data thingy, no idea how it works i got this off stack overflow */}
                {session.status != "loading" ?
                    <form className="py-2" action={"/api/upload?p=" + id + "&u=" + session.data?.user?.name} method="post" encType="multipart/form-data">
                        <input type="file" name="uploaded_file"></input>
                        <Submit></Submit>
                        <div>
                            {context == "graded_true" ? <span className="bg-green-500 rounded px-2 text-2xl">Correct</span> : null}
                            {context == "graded_false" ? <span className="bg-red-500 rounded px-2 text-2xl">Incorrect</span> : null}
                            {context == "error" ? <span className="bg-red-500 rounded px-2 text-2xl">Error</span> : null}
                        </div>
                    </form>
                    : <div>Loading...</div>
                }
            </div>
        </div>;
    }

    function problem_info() {
        return <div className="flex-col">
            <span className="text-4xl px-2">
                <span className="rounded bg-gray-200 px-2">
                    {problem.name}
                </span>
            </span>
            <span className="text-4xl px-2">
                <span className="rounded bg-blue-400 px-2">
                    points: {problem.points}
                </span>
            </span>
            <span className="text-4xl px-2">
                <span className="rounded bg-blue-400 px-2">
                    difficulty: {problem.difficulty}
                </span>
            </span>
        </div>;
    }
};

export default Problem;
