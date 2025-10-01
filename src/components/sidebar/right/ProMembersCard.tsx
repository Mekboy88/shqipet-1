
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const proMembers: Array<{ name: string; image: string }> = [];

const ProMembersCard = () => {
  return (
    <Card className="bg-white rounded-lg shadow-md w-full">
        <div className="p-4 bg-orange-100 rounded-t-lg">
            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <Crown className="w-5 h-5 text-orange-500 mr-2" />
                    <h3 className="font-bold text-md text-orange-800">Pro Members</h3>
                </div>
                <Button variant="ghost" className="text-sm font-semibold text-orange-800 bg-white shadow-sm h-8 hover:bg-gray-50">Put Me Here</Button>
            </div>
        </div>
      <CardContent className="p-4">
        {proMembers.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {proMembers.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center">
                <Avatar className="w-16 h-16 mb-2">
                  <AvatarImage src={member.image} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold truncate w-full">{member.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No pro members to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProMembersCard;
