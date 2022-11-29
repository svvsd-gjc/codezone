import { prisma } from "../../src/db";
import React from "react";

export async function getServerSideProps(ctx) {
    const query = ctx.query;
    const user = await prisma.account.findUnique({
        where: {
            id: query.u
        },
        select: {
            name: true,
            team: true,
            organizer: true,
            solved_problems: {
                select: {
                    name: true,
                    difficulty: true,
                }
            },
            points: true
        }
    })
    return {
        props: {
            data: user
        }
    }
}

const Profile = ({ data }) => {
    return (
        <div className="m-4 rounded bg-gray-200">
            <span className="inline-block m-3 px-2 rounded text-5xl font-bold bg-blue-400">{data.name}</span>
            <span className="float-right m-3 px-2 rounded text-4xl font-bold bg-blue-300">team {data.team}</span>
            <span className="float-right m-3 px-2 rounded text-4xl font-bold bg-blue-300">{data.points} point(s)</span>
            {
                data.organizer ? <span className="float-right m-3 px-2 rounded text-4xl font-bold bg-blue-300 transition all">organizer</span> : null
            }
            <br></br>
            {
                data.solved_problems.map((item) => {
                    return (
                        <div className="inline-block px-2 m-2 text-3xl bg-green-200 rounded">
                            <span className="text-gray-400">+ </span>
                            {item.name} ({item.difficulty} difficulty)
                        </div>
                    )
                })
            }
        </div>
    );
}

export default Profile;
