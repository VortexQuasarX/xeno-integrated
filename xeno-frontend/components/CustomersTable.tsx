interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    totalSpent: string;
    orders?: any[];
}

export default function CustomersTable({ customers, onCustomerClick }: { customers: Customer[], onCustomerClick?: (customer: Customer) => void }) {
    return (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-5">
                <h3 className="text-lg font-semibold text-slate-900">Top Customers</h3>
                <p className="text-sm text-slate-500">Highest spending customers this month</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Total Spent
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {customers.length > 0 ? (
                            customers.map((customer) => (
                                <tr
                                    key={customer.id}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => onCustomerClick && onCustomerClick(customer)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                    {(customer.firstName || '?')[0]}{(customer.lastName || '?')[0]}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-slate-900">
                                                    {customer.firstName || 'Unknown'} {customer.lastName || 'Customer'}
                                                </div>
                                                <div className="text-sm text-slate-500">{customer.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                        ${Number(customer.totalSpent).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500">
                                    No customers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
