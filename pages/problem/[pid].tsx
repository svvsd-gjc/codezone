import { GetServerSidePropsContext } from 'next';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import Submit from "../../components/submit";
import { prisma } from "../../src/db";
import config from "../../code-comp.json";

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

    // fetch completion status
    const [completed, setCompleted] = useState(false);
    useEffect(() => {
        fetch("/api/userHasCompleted" + "?u=" + session.data?.user?.name + "&p=" + id).then(res => res.json()).then(data => {
            setCompleted(data.completed);
        });
    }, [session])

    return (
        <>
            <div className="p-3">
                {problem_info()}
                {problem_dashboard()}
            </div>
        </>
    );

    function problem_dashboard() {
        return <div className="flex mb-4 pt-4 text-xl dark:text-white">
            <div className="flex-1 bg-gray-50 dark:bg-gray-700 px-1">
                <div className="font-extrabold">Description</div>
                {problem.description}
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-600 px-1">
                {/* render all example cases so the user can see what they'll be graded for */}
                {/* TODO differentiate between cases, because they can kinda just look like a blob */}
                {Object.keys(example_cases).map((case_name: any, case_idx: number) =>
                    <div className="pb-6" key={case_name}>
                        <span className="font-bold text-xl">Example Case {case_idx}</span>
                        <div className="font-extrabold">⇒ Inputs</div>
                        {example_cases[case_name].inputs.map((_in: any, index: number) => (<span key={index} className="dark:text-gray-300">{example_cases[case_name].inputs[index]}<br /></span>))}
                        <div className="font-extrabold">⇐ Outputs</div>
                        {example_cases[case_name].outputs.map((_out: any, index: number) => (<span key={index} className="dark:text-gray-300">{example_cases[case_name].outputs[index]}<br /></span>))}
                    </div>
                )}
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-700 px-1">
                <div className="font-extrabold">Submit</div>
                {/* fancy multer form data thingy, no idea how it works i got this off stack overflow */}
                {session.status != "loading" ?
                    <form className="py-2" action={"/api/upload?p=" + id + "&u=" + session.data?.user?.name} method="post" encType="multipart/form-data">
                        <input type="file" name="uploaded_file"></input>
                        <Submit></Submit>
                        <div>
                            {context == "graded_true" ? <span className="bg-green-500 dark:bg-green-700 rounded px-2 text-2xl">Correct</span> : null}
                            {context == "graded_false" ? <span className="bg-red-500 dark:bg-red-700 rounded px-2 text-2xl">Incorrect</span> : null}
                            {context == "nofile" ? <span className="bg-blue-300 dark:bg-blue-500 rounded px-2 text-2xl">No file provided</span> : null}
                            {context == "error" ? <span className="bg-red-500 dark:bg-red-700 rounded px-2 text-2xl">Error</span> : null}
                        </div>
                    </form>
                    : <div>Loading...</div>
                }
            </div>
        </div >;
    }

    function problem_info() {
        return <div className="flex-col dark:text-white">
            <span className="text-4xl px-2">
                <span className="rounded bg-gray-200 dark:bg-gray-600 px-2">
                    <span className="italic">
                        ({
                            problem.difficulty <= config['difficulty-easy'] ?
                                <>Easy</>
                                :
                                problem.difficulty <= config['difficulty-medium'] ?
                                    <>Medium</>
                                    :
                                    problem.difficulty <= config['difficulty-hard'] ?
                                        <>Hard</>
                                        :
                                        <>Insane</>
                        }){' '}
                    </span>

                    {problem.name}
                </span>
            </span>
            <span className="text-4xl px-2">
                <span className="rounded bg-blue-400 dark:bg-blue-500 px-2">
                    Points: {problem.points}
                </span>
            </span>
            {completed ? <span className="text-4xl px-2"><span className="rounded bg-green-500 dark:bg-green-600 px-2">Complete</span></span> : <></>}
        </div>;
    }
};

export default Problem;
