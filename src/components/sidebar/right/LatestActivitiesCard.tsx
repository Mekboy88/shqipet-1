
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RefreshCw } from 'lucide-react';

const activities: Array<{
  user: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
  icon: string;
}> = [];

const LatestActivitiesCard = () => {
    return (
        <Card className="bg-white rounded-lg shadow-md w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                <CardTitle className="text-lg font-bold text-gray-700">Latest Activities</CardTitle>
                <Button variant="ghost" size="icon">
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                {activities.length > 0 ? (
                    <ul className="space-y-2">
                        {activities.map((activity, index) => (
                            <li key={index} className="flex items-center space-x-3 bg-gray-100 p-2 rounded-lg">
                                <div className="relative">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={activity.avatar} alt={activity.user} />
                                        <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 flex items-center justify-center border">
                                        <span className="text-xs">{activity.icon}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">
                                    <a href="#" className="font-semibold text-red-600 hover:underline">{activity.user}</a>
                                    {' '}{activity.action}{' '}
                                    <a href="#" className="font-bold text-gray-800 hover:underline">{activity.target}</a>.
                                    {' '}{activity.time}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No recent activities</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default LatestActivitiesCard;
