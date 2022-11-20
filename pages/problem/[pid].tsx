import React from 'react';
import Header from '../../components/header';
import Submit from "../../components/submit";
import { prisma } from "../../src/db";
import { useCookies } from "react-cookie";

export async function getServerSideProps(ctx) {
    const query = ctx.query;
    const problem = await prisma.problem.findUnique({
        where: {
            id: query.pid
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

const Problem = ({ problem, id, context }) => {

    const [cookie, setCookie] = useCookies(["user"]);
    const user = cookie.user;

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
            <div className="grow bg-gray-50">
                <div className="font-extrabold">description</div>
                {problem.description}
            </div>
            <div className="grow bg-gray-100">
                <div className="font-extrabold">example inputs</div>
                {example_cases.case0.inputs.map((input: any, index: React.Key) => (<span key={index}>{example_cases.case0.inputs[index]}<br /></span>))}
                <div className="font-extrabold">example outputs</div>
                {example_cases.case0.outputs.map((output, index) => (<span key={index}>{example_cases.case0.outputs[index]}<br /></span>))}
            </div>
            <div className="grow bg-gray-50">
                <div className="font-extrabold">submissions</div>
                {/* fancy multer form data thingy, no idea how it works i got this off stack overflow */}
                <form className="py-2" action={"/api/upload?p=" + id + "&u=" + user} method="post" encType="multipart/form-data">
                    <input type="file" name="uploaded_file"></input>
                    <Submit></Submit>
                    <div>
                        {context == "graded_true" ? <span className="bg-green-500 rounded px-2 text-2xl">Correct</span> : null}
                        {context == "graded_false" ? <span className="bg-red-500 rounded px-2 text-2xl">Incorrect</span> : null}
                        {context == "error" ? <span className="bg-red-500 rounded px-2 text-2xl">Error</span> : null}
                    </div>
                </form>
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
