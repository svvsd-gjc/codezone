import { ReactNode } from "react";

function Table({ children, headers }: { children: ReactNode, headers: string[] }) {
    return <div className="flex flex-col p-4">
        <div className="overflow-x-auto">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-500 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-500 shadow-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr key="head">
                                {headers.map((value) => <th key={value} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{value}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 content dark:bg-gray-600 dark:divide-gray-500">
                            {children}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>;
}

export default Table;