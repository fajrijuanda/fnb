'use client';

interface AdminHeaderProps {
    title: string;
    description: string;
    action?: React.ReactNode;
}

export const AdminHeader = ({ title, description, action }: AdminHeaderProps) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 xl:mb-6">
            <div>
                <h1 className="text-lg xl:text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
                <p className="text-xs xl:text-sm text-gray-500 dark:text-gray-200">{description}</p>
            </div>

            {action && (
                <div className="flex items-center gap-2">
                    {action}
                </div>
            )}
        </div>
    );
};
