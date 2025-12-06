import { Users, ShoppingBag, DollarSign, TrendingUp, TrendingDown, FileText } from 'lucide-react';

interface OverviewData {
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    draftOrdersCount?: number;
    confirmedOrdersCount?: number;
}

export default function KPICards({ data }: { data: OverviewData | null }) {
    const stats = [
        {
            name: 'Total Revenue',
            value: data ? `$${Number(data.totalRevenue).toFixed(2)}` : '$0.00',
            icon: DollarSign,
            change: '+12.5%',
            changeType: 'increase',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            name: 'Total Orders',
            value: data?.totalOrders || 0,
            icon: ShoppingBag,
            change: '+5.2%',
            changeType: 'increase',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            name: 'Total Customers',
            value: data?.totalCustomers || 0,
            icon: Users,
            change: '-1.2%',
            changeType: 'decrease',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
        },

    ];

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((item) => (
                <div
                    key={item.name}
                    className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 hover:shadow-md transition-shadow duration-200"
                >
                    <dt>
                        <div className={`absolute rounded-md p-3 ${item.bgColor}`}>
                            <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                        </div>
                        <p className="ml-16 truncate text-sm font-medium text-slate-500">{item.name}</p>
                    </dt>
                    <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
                        <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                        <p
                            className={`ml-2 flex items-baseline text-sm font-semibold ${item.changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'
                                }`}
                        >
                            {item.changeType === 'increase' ? (
                                <TrendingUp className="h-4 w-4 flex-shrink-0 self-center text-emerald-500" aria-hidden="true" />
                            ) : (
                                <TrendingDown className="h-4 w-4 flex-shrink-0 self-center text-red-500" aria-hidden="true" />
                            )}
                            <span className="sr-only"> {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by </span>
                            {item.change}
                        </p>
                    </dd>
                </div>
            ))}
        </div>
    );
}
