import config from "../code-comp.json";

function DifficultyBadge(problem: any) {
    return problem.difficulty <= config['difficulty-easy'] ?
        <div className="nm-inset-green-100 shadow-inner dark:nm-inset-green-200 border border-green-400 text-green-700 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
            Easy
        </div>
        :
        problem.difficulty <= config['difficulty-medium'] ?
            <div className="nm-inset-orange-100 shadow-inner dark:nm-inset-orange-300 border border-orange-400 text-orange-700 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                Medium
            </div>
            :
            problem.difficulty <= config['difficulty-hard'] ?
                <div className="nm-inset-red-100 shadow-inner dark:nm-inset-red-300 border border-red-400 text-red-700 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    Hard
                </div>
                :
                <div className="nm-inset-gray-100 shadow-inner dark:nm-inset-purple-100 border border-purple-400 text-purple-700 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    Insane
                </div>;
}
export default DifficultyBadge;