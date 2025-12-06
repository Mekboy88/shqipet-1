# Admin Message & Notification Dropdowns - Complete UI Export

This file contains 100% exact code for the Messages and Notifications dropdown buttons and their complete functionality from the Admin Settings page.

---

## 1. MessageDropdown.tsx (Messages Button + Dropdown)

```tsx
// src/components/admin/MessageDropdown.tsx

import React, { useState } from 'react';
import { MessageSquare, Bot, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminInbox from './AdminInbox';
interface MessageDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const MessageDropdown: React.FC<MessageDropdownProps> = ({
  open,
  onOpenChange
}) => {
  const [inboxOpen, setInboxOpen] = useState(false);
  const messages = [{
    id: 1,
    sender: "Luna AI",
    avatar: null,
    message: "System analysis completed. 3 optimization suggestions available.",
    time: "5 min ago",
    type: "ai",
    unread: true
  }, {
    id: 2,
    sender: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
    message: "Can you review the new user permissions request?",
    time: "12 min ago",
    type: "user",
    unread: true
  }, {
    id: 3,
    sender: "System Admin",
    avatar: null,
    message: "Weekly security report is now available for download.",
    time: "1 hour ago",
    type: "system",
    unread: false
  }, {
    id: 4,
    sender: "Mike Johnson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
    message: "Database backup script needs your approval.",
    time: "2 hours ago",
    type: "user",
    unread: false
  }];
  const unreadCount = messages.filter(m => m.unread).length;
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ai':
        return <Bot className="h-4 w-4 text-blue-600" />;
      case 'system':
        return <Mail className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-green-600" />;
    }
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 transition-colors">
            <MessageSquare className="h-5 w-5 text-gray-700" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 rounded-xl shadow-lg border-none z-[999]" align="end" sideOffset={24}>
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Admin Messages</h3>
                <p className="text-sm text-gray-500">{unreadCount} unread messages</p>
              </div>
              <svg 
                className="h-12 w-12 flex-shrink-0 text-gray-600" 
                fill="currentColor" 
                viewBox="0 0 512.055 512.055" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M480.737,414.086c-10.786-15.799-25.828-26.767-43.5-31.717c-0.172-0.048-0.346-0.09-0.521-0.127l-63.821-13.349 l-17.179-26.049c-0.089-0.135-0.182-0.267-0.278-0.396c-2.604-3.471-6.566-5.761-10.874-6.284c-4.306-0.522-8.701,0.753-12.059,3.5 c-0.052,0.042-0.103,0.085-0.153,0.128l-76.325,65.701l-76.325-65.701c-0.051-0.043-0.102-0.086-0.153-0.128 c-3.358-2.748-7.757-4.023-12.06-3.5c-4.307,0.523-8.27,2.813-10.873,6.284c-0.097,0.129-0.19,0.261-0.278,0.396l-17.179,26.049 l-63.821,13.349c-0.175,0.037-0.349,0.079-0.521,0.127c-17.672,4.951-32.714,15.918-43.5,31.717 c-9.866,14.45-15.299,31.891-15.299,49.108v19.843c0,15.999,14.355,29.016,32.001,29.016h183.985c0.01,0,0.02,0.001,0.03,0.001 c0.011,0,0.022-0.001,0.033-0.001h47.918c0.011,0,0.022,0.001,0.033,0.001c0.01,0,0.02-0.001,0.03-0.001h183.985 c17.646,0,32.001-13.017,32.001-29.016v-19.843C496.036,445.977,490.603,428.536,480.737,414.086z M342.628,352.059l15.674,23.767 l-55.236,75.949l-17.378-17.377c-0.002-0.002-0.004-0.004-0.006-0.006l-17.902-17.902L342.628,352.059z M248.027,472.052h16.001 c0.481,0,0.958-0.019,1.432-0.046l4.81,24.048h-28.485l4.81-24.048C247.069,472.033,247.546,472.052,248.027,472.052z M272.028,448.051c0,4.411-3.589,8-8,8h-16.001c-4.412,0-8-3.589-8-8v-4.687l16.001-16.001l16.001,16.001V448.051z M169.427,352.059l74.848,64.43l-17.902,17.902c-0.002,0.002-0.004,0.004-0.006,0.006l-17.378,17.377l-55.236-75.949 L169.427,352.059z M32.018,483.037v-19.843c0-25.88,16.097-56.588,46.866-65.349l61.712-12.908l60.959,83.819 c1.376,1.892,3.511,3.087,5.844,3.27c0.209,0.016,0.418,0.024,0.626,0.024c2.113,0,4.15-0.837,5.656-2.343l12.262-12.262 c1.309,3.066,3.242,5.802,5.634,8.058l-6.11,30.549H48.019C39.197,496.053,32.018,490.214,32.018,483.037z M480.036,483.037 c0,7.177-7.178,13.016-16.001,13.016H286.587l-6.11-30.549c2.392-2.255,4.325-4.992,5.634-8.058l12.262,12.262 c1.506,1.506,3.543,2.343,5.656,2.343c0.208,0,0.417-0.008,0.626-0.024c2.333-0.183,4.468-1.378,5.844-3.27l60.959-83.819 l61.712,12.908c30.77,8.761,46.866,39.469,46.866,65.349V483.037z"/>
                <path d="M120.022,254.686v97.38c0,4.418,3.582,8,8,8s8-3.582,8-8v-96.004h7.33c5.937,18.724,15.206,36.329,27.295,51.301 c23.268,28.815,53.618,44.685,85.459,44.685c24.659,0,48.591-9.593,69.21-27.742c0.099-0.087,0.186-0.182,0.279-0.272 c1.281,0.084,2.564,0.14,3.852,0.14c9.347,0,18.854-2.214,28.096-6.688c30.2-14.617,50.49-48.946,50.49-85.423V184.06 c0-13.234-10.767-24.001-24-24.001h-3.274c17.729-67.605,9.697-123.106,2.596-139.246c-0.012-0.028-0.028-0.053-0.041-0.081 c-0.071-0.156-0.149-0.306-0.229-0.456c-0.047-0.088-0.092-0.179-0.142-0.265c-0.076-0.13-0.159-0.256-0.242-0.381 c-0.066-0.1-0.129-0.201-0.199-0.297c-0.071-0.098-0.148-0.19-0.223-0.284c-0.091-0.114-0.181-0.229-0.278-0.338 c-0.061-0.068-0.127-0.132-0.19-0.198c-0.118-0.123-0.235-0.246-0.36-0.361c-0.055-0.051-0.115-0.097-0.171-0.146 c-0.137-0.119-0.275-0.237-0.419-0.347c-0.063-0.047-0.129-0.089-0.193-0.135c-0.143-0.102-0.286-0.203-0.436-0.295 c-0.081-0.05-0.167-0.094-0.25-0.141c-0.136-0.078-0.272-0.156-0.413-0.226c-0.105-0.052-0.215-0.096-0.322-0.143 c-0.125-0.055-0.248-0.112-0.375-0.161c-0.121-0.046-0.246-0.083-0.37-0.124c-0.12-0.039-0.239-0.081-0.361-0.115 c-0.123-0.034-0.248-0.058-0.373-0.086c-0.13-0.029-0.259-0.061-0.391-0.083c-0.111-0.019-0.224-0.03-0.336-0.044 c-0.151-0.02-0.301-0.04-0.453-0.05c-0.094-0.006-0.189-0.006-0.284-0.01c-0.173-0.006-0.347-0.01-0.521-0.005 c-0.083,0.002-0.166,0.011-0.249,0.016c-0.184,0.012-0.368,0.026-0.552,0.05c-0.027,0.004-0.054,0.004-0.082,0.008 c-20.061,2.866-44.351-2.012-70.066-7.175C261.715,0.282,217.162-8.642,182.326,16.2c-0.524-0.108-1.066-0.165-1.622-0.165 c-35.729,0-60.682,29.608-60.682,72.002c0,19.63,4.947,49.438,9.335,72.021h-1.335c-13.234,0-24,10.767-24,24.001v48.002 C104.022,242.491,110.711,251.384,120.022,254.686z M350.572,303.083c-16.883,8.171-34.197,6.476-48.86-4.742 c1.484-3.117,2.317-6.602,2.317-10.277c0-13.234-10.767-24.001-24-24.001s-24,10.767-24,24.001c0,13.234,10.767,24,24,24 c3.702,0,7.211-0.844,10.345-2.347c0.217,0.217,0.445,0.426,0.692,0.621c4.715,3.73,9.702,6.7,14.867,8.928 c-15.45,11-32.483,16.781-49.826,16.781c-26.911,0-52.84-13.757-73.01-38.736c-19.908-24.655-31.326-57.284-31.326-89.521v-9.112 c0-28.498,16.161-66.981,21.655-79.238c55.276-6.495,99.31-0.006,126.772,6.703c24.089,5.886,39.896,12.934,45.595,15.701 l14.428,34.33v31.68c0,26.46-7.696,53.45-21.67,75.999c-2.327,3.755-1.169,8.687,2.586,11.014c1.313,0.813,2.769,1.201,4.207,1.201 c2.678,0,5.294-1.344,6.808-3.787c6.968-11.243,12.517-23.484,16.531-36.218h15.351c1.545,0,3.055-0.152,4.52-0.433 C382.381,276.43,368.458,294.427,350.572,303.083z M288.029,288.064c0,4.411-3.589,8-8,8s-8-3.589-8-8c0-4.412,3.589-8.001,8-8.001 S288.029,283.652,288.029,288.064z M392.033,184.06v48.002c0,4.411-3.589,8-8,8h-11.175c2.208-10.635,3.363-21.46,3.363-32.209 v-31.794h7.812C388.444,176.059,392.033,179.648,392.033,184.06z M180.704,32.035c0.772,0,1.517-0.115,2.223-0.32 c2.342,0.671,4.958,0.277,7.047-1.31c29.374-22.312,71.231-13.906,111.709-5.778c21.237,4.265,41.547,8.343,60.306,8.343 c2.89,0,5.74-0.109,8.555-0.317c4.922,17.755,9.586,62.524-3.828,117.681l-7.311-17.395c-0.697-1.658-1.932-3.033-3.507-3.903 c-2.952-1.63-73.617-39.764-188.896-24.933c-0.019,0.002-0.037,0.008-0.056,0.01c-0.153,0.021-0.304,0.052-0.456,0.082 c-0.113,0.022-0.228,0.04-0.339,0.066c-0.099,0.024-0.196,0.057-0.295,0.084c-0.913,0.256-1.757,0.659-2.498,1.192 c-0.003,0.002-0.007,0.004-0.011,0.007c-0.064,0.046-0.122,0.099-0.184,0.146c-0.525,0.402-1.007,0.869-1.426,1.403 c-0.016,0.02-0.033,0.038-0.048,0.057c-0.083,0.107-0.156,0.223-0.234,0.334c-0.074,0.107-0.152,0.211-0.221,0.322 c-0.05,0.081-0.094,0.167-0.141,0.25c-0.087,0.15-0.173,0.301-0.25,0.457c-0.007,0.015-0.016,0.028-0.023,0.043 c-0.619,1.282-9.674,20.183-16.721,43.296c-3.985-21.14-8.077-46.957-8.077-63.816C136.022,49.351,158.464,32.035,180.704,32.035z M120.022,184.06c0-4.412,3.589-8.001,8-8.001h4.582c1.51,7.145,2.689,12.345,3.166,14.42v17.311 c0,10.801,1.163,21.643,3.384,32.272h-11.132c-4.412,0-8-3.589-8-8V184.06z"/>
              </svg>
            </div>
            
            <div className="max-h-96 overflow-y-auto pb-4">
              {messages.map(message => <div key={message.id} className={`p-4 border-b border-gray-50 hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 cursor-pointer ${message.unread ? 'bg-blue-50/50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        {message.avatar && <AvatarImage src={message.avatar} alt={message.sender} />}
                        <AvatarFallback className="text-xs">
                          {getInitials(message.sender)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                        {getTypeIcon(message.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {message.sender}
                        </p>
                        {message.unread && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {message.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {message.time}
                      </p>
                    </div>
                  </div>
                </div>)}
            </div>
            
            <div className="p-3 border-t border-gray-200 bg-white">
              <Button 
                variant="ghost" 
                className="w-full text-sm text-gray-700 hover:shadow-lg hover:shadow-[#517DF3]/30 hover:scale-105 transition-all duration-300 font-medium"
                onClick={() => {
                  onOpenChange(false);
                  setInboxOpen(true);
                }}
              >
                <span className="flex items-center gap-2">
                  Open Inbox
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.0867 21.3877L13.7321 21.7697L13.0867 21.3877ZM13.6288 20.4718L12.9833 20.0898L13.6288 20.4718ZM10.3712 20.4718L9.72579 20.8539H9.72579L10.3712 20.4718ZM10.9133 21.3877L11.5587 21.0057L10.9133 21.3877ZM1.25 10.5C1.25 10.9142 1.58579 11.25 2 11.25C2.41421 11.25 2.75 10.9142 2.75 10.5H1.25ZM3.07351 15.6264C2.915 15.2437 2.47627 15.062 2.09359 15.2205C1.71091 15.379 1.52918 15.8177 1.68769 16.2004L3.07351 15.6264ZM7.78958 18.9915L7.77666 19.7413L7.78958 18.9915ZM5.08658 18.6194L4.79957 19.3123H4.79957L5.08658 18.6194ZM21.6194 15.9134L22.3123 16.2004V16.2004L21.6194 15.9134ZM16.2104 18.9915L16.1975 18.2416L16.2104 18.9915ZM18.9134 18.6194L19.2004 19.3123H19.2004L18.9134 18.6194ZM19.6125 2.7368L19.2206 3.37628L19.6125 2.7368ZM21.2632 4.38751L21.9027 3.99563V3.99563L21.2632 4.38751ZM4.38751 2.7368L3.99563 2.09732V2.09732L4.38751 2.7368ZM2.7368 4.38751L2.09732 3.99563H2.09732L2.7368 4.38751ZM9.40279 19.2098L9.77986 18.5615L9.77986 18.5615L9.40279 19.2098ZM13.7321 21.7697L14.2742 20.8539L12.9833 20.0898L12.4412 21.0057L13.7321 21.7697ZM9.72579 20.8539L10.2679 21.7697L11.5587 21.0057L11.0166 20.0898L9.72579 20.8539ZM12.4412 21.0057C12.2485 21.3313 11.7515 21.3313 11.5587 21.0057L10.2679 21.7697C11.0415 23.0767 12.9585 23.0767 13.7321 21.7697L12.4412 21.0057ZM10.5 2.75H13.5V1.25H10.5V2.75ZM21.25 10.5V11.5H22.75V10.5H21.25ZM7.8025 18.2416C6.54706 18.2199 5.88923 18.1401 5.37359 17.9265L4.79957 19.3123C5.60454 19.6457 6.52138 19.7197 7.77666 19.7413L7.8025 18.2416ZM1.68769 16.2004C2.27128 17.6093 3.39066 18.7287 4.79957 19.3123L5.3736 17.9265C4.33223 17.4951 3.50486 16.6678 3.07351 15.6264L1.68769 16.2004ZM21.25 11.5C21.25 12.6751 21.2496 13.5189 21.2042 14.1847C21.1592 14.8438 21.0726 15.2736 20.9265 15.6264L22.3123 16.2004C22.5468 15.6344 22.6505 15.0223 22.7007 14.2868C22.7504 13.5581 22.75 12.6546 22.75 11.5H21.25ZM16.2233 19.7413C17.4786 19.7197 18.3955 19.6457 19.2004 19.3123L18.6264 17.9265C18.1108 18.1401 17.4529 18.2199 16.1975 18.2416L16.2233 19.7413ZM20.9265 15.6264C20.4951 16.6678 19.6678 17.4951 18.6264 17.9265L19.2004 19.3123C20.6093 18.7287 21.7287 17.6093 22.3123 16.2004L20.9265 15.6264ZM13.5 2.75C15.1512 2.75 16.337 2.75079 17.2619 2.83873C18.1757 2.92561 18.7571 3.09223 19.2206 3.37628L20.0044 2.09732C19.2655 1.64457 18.4274 1.44279 17.4039 1.34547C16.3915 1.24921 15.1222 1.25 13.5 1.25V2.75ZM22.75 10.5C22.75 8.87781 22.7508 7.6085 22.6545 6.59611C22.5572 5.57256 22.3554 4.73445 21.9027 3.99563L20.6237 4.77938C20.9078 5.24291 21.0744 5.82434 21.1613 6.73809C21.2492 7.663 21.25 8.84876 21.25 10.5H22.75ZM19.2206 3.37628C19.7925 3.72672 20.2733 4.20752 20.6237 4.77938L21.9027 3.99563C21.4286 3.22194 20.7781 2.57144 20.0044 2.09732L19.2206 3.37628ZM10.5 1.25C8.87781 1.25 7.6085 1.24921 6.59611 1.34547C5.57256 1.44279 4.73445 1.64457 3.99563 2.09732L4.77938 3.37628C5.24291 3.09223 5.82434 2.92561 6.73809 2.83873C7.663 2.75079 8.84876 2.75 10.5 2.75V1.25ZM2.75 10.5C2.75 8.84876 2.75079 7.663 2.83873 6.73809C2.92561 5.82434 3.09223 5.24291 3.37628 4.77938L2.09732 3.99563C1.64457 4.73445 1.44279 5.57256 1.34547 6.59611C1.24921 7.6085 1.25 8.87781 1.25 10.5H2.75ZM3.99563 2.09732C3.22194 2.57144 2.57144 3.22194 2.09732 3.99563L3.37628 4.77938C3.72672 4.20752 4.20752 3.72672 4.77938 3.37628L3.99563 2.09732ZM11.0166 20.0898C10.8136 19.7468 10.6354 19.4441 10.4621 19.2063C10.2795 18.9559 10.0702 18.7304 9.77986 18.5615L9.02572 19.8582C9.07313 19.8857 9.13772 19.936 9.24985 20.0898C9.37122 20.2564 9.50835 20.4865 9.72579 20.8539L11.0166 20.0898ZM7.77666 19.7413C8.21575 19.7489 8.49387 19.7545 8.70588 19.7779C8.90399 19.7999 8.98078 19.832 9.02572 19.8582L9.77986 18.5615C9.4871 18.3912 9.18246 18.3215 8.87097 18.287C8.57339 18.2541 8.21375 18.2487 7.8025 18.2416L7.77666 19.7413ZM14.2742 20.8539C14.4916 20.4865 14.6287 20.2564 14.7501 20.0898C14.8622 19.936 14.9268 19.8857 14.9742 19.8582L14.2201 18.5615C13.9298 18.7304 13.7204 18.9559 13.5379 19.2063C13.3646 19.4441 13.1864 19.7468 12.9833 20.0898L14.2742 20.8539ZM16.1975 18.2416C15.7862 18.2487 15.4266 18.2541 15.129 18.287C14.8175 18.3215 14.5129 18.3912 14.2201 18.5615L14.9742 19.8582C15.0192 19.832 15.096 19.7999 15.2941 19.7779C15.5061 19.7545 15.7842 19.7489 16.2233 19.7413L16.1975 18.2416Z" fill="#517DF3"/>
                    <path d="M15.5 7.83008L15.6716 8.00165C17.0049 9.33498 17.6716 10.0017 17.6716 10.8301C17.6716 11.6585 17.0049 12.3252 15.6716 13.6585L15.5 13.8301" stroke="#517DF3" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M13.2939 6L11.9998 10.8296L10.7058 15.6593" stroke="#517DF3" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8.49994 7.83008L8.32837 8.00165C6.99504 9.33498 6.32837 10.0017 6.32837 10.8301C6.32837 11.6585 6.99504 12.3252 8.32837 13.6585L8.49994 13.8301" stroke="#517DF3" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <AdminInbox 
        isOpen={inboxOpen} 
        onClose={() => setInboxOpen(false)} 
        mode="compact"
      />
    </>
  );
};
export default MessageDropdown;
```

---

## 2. AdminHeader.tsx - Notification Button (Bell Icon in Header)

This is the notification button from the AdminHeader component:

```tsx
// src/components/admin/AdminHeader.tsx (Notification Button Section)

import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Inside AdminHeader component:

// Notification state
const [notificationOpen, setNotificationOpen] = useState(false);
const [notifications, setNotifications] = useState([
  { 
    id: 1, 
    message: "New user registration request", 
    type: "info", 
    time: "2 min ago", 
    unread: true 
  },
  { 
    id: 2, 
    message: "System backup completed successfully", 
    type: "success", 
    time: "1 hour ago", 
    unread: true 
  },
  { 
    id: 3, 
    message: "Security alert: Multiple failed login attempts", 
    type: "warning", 
    time: "3 hours ago", 
    unread: false 
  }
]);

// Notification Button JSX:
<Button
  variant="ghost"
  size="sm"
  onClick={() => setNotificationOpen(!notificationOpen)}
  className="relative"
>
  <Bell className="h-5 w-5" />
  {notifications.length > 0 && (
    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
      {notifications.length}
    </span>
  )}
</Button>
```

---

## 3. AdminInbox.tsx (Full Inbox Window that Opens from Messages)

```tsx
// src/components/admin/AdminInbox.tsx

import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Maximize2, Minimize2, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConversationsList from './ConversationsList';
import ThreadView from './ThreadView';
import UserMetadataPanel from './UserMetadataPanel';
import AdminInboxSettings from './AdminInboxSettings';
import { cn } from '@/lib/utils';

interface AdminInboxProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'bubble' | 'compact' | 'sidebar' | 'fullscreen';
}

interface AdminInboxBubbleProps {
  onClick: () => void;
  unreadCount: number;
}

export const AdminInboxBubble: React.FC<AdminInboxBubbleProps> = ({ onClick, unreadCount }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="relative">
        <button
          onClick={onClick}
          className="bg-primary hover:bg-primary/90 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 relative overflow-hidden"
        >
          <MessageCircle className="w-6 h-6 relative z-10" />
          {unreadCount > 0 && (
            <>
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center z-20 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const AdminInbox: React.FC<AdminInboxProps> = ({ 
  isOpen, 
  onClose, 
  mode = 'bubble' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThread, setSelectedThread] = useState<number | null>(1);
  const [showSettings, setShowSettings] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [theme, setTheme] = useState('dark');
  const [isMinimized, setIsMinimized] = useState(false);

  // Sample data
  const conversations = [
    {
      id: 1,
      user: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
      lastMessage: "I need help with my Pro subscription billing",
      timestamp: "2 min ago",
      unread: true,
      type: "pro" as const,
      country: "🇺🇸",
      status: "open" as const,
      priority: "high" as const
    },
    {
      id: 2,
      user: "Mike Johnson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      lastMessage: "System error when uploading files",
      timestamp: "15 min ago",
      unread: true,
      type: "system" as const,
      country: "🇬🇧",
      status: "flagged" as const,
      priority: "high" as const
    },
    {
      id: 3,
      user: "Ana Rodriguez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
      lastMessage: "Thank you for resolving my issue!",
      timestamp: "1 hour ago",
      unread: false,
      type: "support" as const,
      country: "🇪🇸",
      status: "resolved" as const,
      priority: "low" as const
    }
  ];

  const messages = [
    {
      id: 1,
      sender: "Sarah Chen",
      content: "Hi, I'm having trouble with my Pro subscription billing. The payment failed but I was still charged.",
      timestamp: "2:34 PM",
      isAdmin: false,
      type: "text" as const
    },
    {
      id: 2,
      sender: "Admin Support",
      content: "Hello Sarah! I can help you with that. Let me check your billing history right away.",
      timestamp: "2:35 PM",
      isAdmin: true,
      type: "text" as const
    }
  ];

  const handleSendMessage = (content: string) => {
    console.log('Sending message:', content);
  };

  const handleAction = (action: string) => {
    console.log('Performing action:', action);
  };

  const getThemeColors = (themeName: string) => {
    const themes = {
      dark: { bg: 'hsl(var(--background))', border: 'hsl(var(--border))', accent: 'hsl(var(--primary))' },
      midnight: { bg: '#0F172A', border: '#1E293B', accent: '#3B82F6' },
      forest: { bg: '#064E3B', border: '#065F46', accent: '#10B981' },
      burgundy: { bg: '#7C2D12', border: '#92400E', accent: '#F59E0B' }
    };
    return themes[themeName as keyof typeof themes] || themes.dark;
  };

  const handleExpand = () => {
    console.log('Current mode before expand:', currentMode);
    console.log('Window dimensions:', { width: window.innerWidth, height: window.innerHeight });
    
    if (currentMode === 'compact') {
      console.log('Changing to sidebar mode');
      setCurrentMode('sidebar');
    } else if (currentMode === 'sidebar') {
      console.log('Changing to fullscreen mode');
      setCurrentMode('fullscreen');
    } else {
      console.log('Changing to compact mode');
      setCurrentMode('compact');
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const currentUser = conversations.find(c => c.id === selectedThread);
  const threadDetails = {
    type: currentUser?.type || 'support',
    status: currentUser?.status || 'open',
    priority: currentUser?.priority || 'medium'
  };

  const unreadCount = conversations.filter(c => c.unread).length;

  // Render bubble if mode is bubble and not open
  if (currentMode === 'bubble' && !isOpen) {
    return <AdminInboxBubble onClick={() => {
      setCurrentMode('compact');
      // Trigger the opening via parent component
    }} unreadCount={unreadCount} />;
  }

  // Don't render if not open
  if (!isOpen) return null;

  // Get container classes based on mode with proper viewport constraints
  const getContainerClasses = () => {
    console.log('Getting container classes for mode:', currentMode);
    
    // Use much higher z-index to ensure it's above everything
    const baseClasses = "fixed bg-background border shadow-2xl overflow-hidden transition-all duration-300 ease-in-out";
    
    switch (currentMode) {
      case 'compact':
        const compactClasses = cn(
          baseClasses,
          "rounded-xl border-border z-[99999]",
          // Start from a safe position that's always visible
          "top-16 right-4",
          "w-[420px] h-[600px]",
          // Ensure it stays within bounds
          "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)]",
          isMinimized ? "!h-12" : ""
        );
        console.log('Compact classes:', compactClasses);
        return compactClasses;
        
      case 'sidebar':
        const sidebarClasses = cn(
          baseClasses,
          "border-l border-border z-[99999]",
          // Ensure it starts below any header
          "top-0 right-0 h-screen",
          "w-[600px]"
        );
        console.log('Sidebar classes:', sidebarClasses);
        return sidebarClasses;
        
      case 'fullscreen':
        // Large sidebar that fits all content without scrolling
        const fullscreenClasses = cn(
          "fixed top-0 right-0 h-screen w-[1200px] max-w-[75vw] bg-[#181C20] z-[50] border-l border-[#272C30] shadow-2xl overflow-hidden"
        );
        console.log('Fullscreen classes:', fullscreenClasses);
        return fullscreenClasses;
        
      default:
        return cn(
          baseClasses, 
          "top-16 right-4 rounded-xl border-border z-[99999]",
          "w-[420px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)]"
        );
    }
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="relative">
          <MessageCircle className="w-5 h-5 text-primary" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></div>
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Admin Inbox</h2>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">{unreadCount} unread messages</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {currentMode !== 'fullscreen' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMinimize}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExpand}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(true)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isMinimized) return null;

    if (currentMode === 'fullscreen') {
      return (
        <>
          {/* Header for fullscreen */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card h-16 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <MessageCircle className="w-5 h-5 text-primary" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></div>
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Admin Inbox</h2>
                {unreadCount > 0 && (
                  <span className="text-xs text-muted-foreground">{unreadCount} unread messages</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpand}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content for fullscreen */}
          <div className="flex flex-1 h-[calc(100vh-4rem)] min-h-0 overflow-hidden">
            <div className="w-80 flex-shrink-0 bg-[#181C20]">
              <ConversationsList
                conversations={conversations}
                selectedThread={selectedThread}
                onSelectThread={setSelectedThread}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                mode="fullscreen"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <ThreadView
                selectedThread={selectedThread}
                messages={messages}
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                onFlagThread={() => handleAction('flag')}
                onArchiveThread={() => handleAction('archive')}
              />
            </div>
            
            {selectedThread && (
              <div className="w-80 flex-shrink-0 border-l border-[#272C30] bg-[#181C20]">
                <UserMetadataPanel
                  user={currentUser}
                  threadDetails={threadDetails}
                  onAction={handleAction}
                />
              </div>
            )}
          </div>
        </>
      );
    }

    if (currentMode === 'sidebar') {
      return (
        <div className="flex flex-1 h-full">
          <div className="w-64 border-border">
            <ConversationsList
              conversations={conversations}
              selectedThread={selectedThread}
              onSelectThread={setSelectedThread}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              mode="compact"
            />
          </div>
          
          <div className="flex-1">
            <ThreadView
              selectedThread={selectedThread}
              messages={messages}
              currentUser={currentUser}
              onSendMessage={handleSendMessage}
              onFlagThread={() => handleAction('flag')}
              onArchiveThread={() => handleAction('archive')}
            />
          </div>
        </div>
      );
    }

    // Compact mode
    return (
      <div className="flex flex-col flex-1 h-full">
        {!selectedThread ? (
          <ConversationsList
            conversations={conversations}
            selectedThread={selectedThread}
            onSelectThread={setSelectedThread}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            mode="compact"
          />
        ) : (
          <ThreadView
            selectedThread={selectedThread}
            messages={messages}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            onFlagThread={() => handleAction('flag')}
            onArchiveThread={() => handleAction('archive')}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <div className={getContainerClasses()}>
        {currentMode === 'fullscreen' ? (
          <div className="flex flex-col h-full w-full">
            {renderContent()}
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            {renderHeader()}
            <div className="flex-1 min-h-0">
              {renderContent()}
            </div>
          </div>
        )}
      </div>

      {/* Settings panel rendered outside main container to avoid stacking context issues */}
      <AdminInboxSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        onThemeChange={setTheme}
      />
    </>
  );
};

export default AdminInbox;
```

---

## 4. ConversationsList.tsx (Inbox Conversations List)

```tsx
// src/components/admin/ConversationsList.tsx

import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Conversation {
  id: number;
  user: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  type: "pro" | "system" | "support" | "abuse";
  country: string;
  status: "open" | "flagged" | "resolved" | "archived";
  priority: "high" | "medium" | "low";
}

interface ConversationsListProps {
  conversations: Conversation[];
  selectedThread: number | null;
  onSelectThread: (id: number) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  mode: 'compact' | 'fullscreen';
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedThread,
  onSelectThread,
  searchTerm,
  onSearchChange,
  mode
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filters = [
    { id: 'all', label: 'All', count: conversations.length },
    { id: 'unread', label: 'Unread', count: conversations.filter(c => c.unread).length },
    { id: 'flagged', label: 'Flagged', count: conversations.filter(c => c.status === 'flagged').length },
    { id: 'pro', label: 'Pro', count: conversations.filter(c => c.type === 'pro').length },
    { id: 'system', label: 'System', count: conversations.filter(c => c.type === 'system').length },
  ];

  const getStatusBadge = (type: string, status: string, priority: string) => {
    if (type === "pro") return <Badge className="bg-gradient-to-r from-[#517DF3] to-[#B077FF] text-white text-xs">💎 Pro</Badge>;
    if (status === "flagged") return <Badge variant="destructive" className="text-xs">⚠️ Flagged</Badge>;
    if (type === "system") return <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">🛠️ System</Badge>;
    if (priority === "high") return <Badge variant="destructive" className="text-xs">🔴 High</Badge>;
    return null;
  };

  const getConversationGlow = (type: string, unread: boolean) => {
    if (!unread) return '';
    if (type === 'pro') return 'shadow-[0_0_20px_rgba(81,125,243,0.3)] border-l-2 border-l-[#517DF3]';
    if (type === 'system') return 'shadow-[0_0_20px_rgba(255,165,0,0.3)] border-l-2 border-l-orange-500';
    return 'shadow-[0_0_20px_rgba(81,125,243,0.2)] border-l-2 border-l-[#517DF3]';
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'unread') return matchesSearch && conversation.unread;
    if (activeFilter === 'flagged') return matchesSearch && conversation.status === 'flagged';
    if (activeFilter === 'pro') return matchesSearch && conversation.type === 'pro';
    if (activeFilter === 'system') return matchesSearch && conversation.type === 'system';
    
    return matchesSearch;
  });

  const width = mode === 'compact' ? 'w-full' : 'w-[290px]';

  return (
    <div className={`${width} border-[#272C30] flex flex-col bg-[#181C20] h-full`}>
      {/* Search Bar for fullscreen mode */}
      {mode === 'fullscreen' && (
        <div className="p-3 border-b border-[#272C30]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-[#272C30] border-none text-[#F4F5F6] placeholder:text-gray-400"
            />
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="p-3 border-b border-[#272C30]">
        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(filter.id)}
              className={`text-xs h-7 ${
                activeFilter === filter.id 
                  ? 'bg-gradient-to-r from-[#517DF3] to-[#B077FF] text-white' 
                  : 'text-[#F4F5F6] hover:bg-white/5'
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <Badge className="ml-1 h-4 text-xs bg-white/20">
                  {filter.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto border-[#272C30]">
        {filteredConversations.map(conversation => (
          <div
            key={conversation.id}
            onClick={() => onSelectThread(conversation.id)}
            className={`p-4 border-b border-[#272C30] cursor-pointer transition-all hover:bg-white/5 ${
              selectedThread === conversation.id 
                ? 'bg-gradient-to-r from-[#517DF3]/10 to-[#B077FF]/10 border-l-2 border-l-[#517DF3]' 
                : getConversationGlow(conversation.type, conversation.unread)
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.avatar} alt={conversation.user} />
                  <AvatarFallback className="text-xs bg-[#272C30] text-[#F4F5F6]">
                    {conversation.user.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {conversation.unread && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#517DF3] rounded-full animate-pulse" />
                )}
                {conversation.type === 'pro' && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#517DF3] to-[#B077FF] rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white">💎</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#F4F5F6] truncate">
                    {conversation.user}
                  </span>
                  <span className="text-xs">{conversation.country}</span>
                  {getStatusBadge(conversation.type, conversation.status, conversation.priority)}
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {conversation.lastMessage}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {conversation.timestamp}
                  </p>
                  {conversation.unread && (
                    <div className="w-2 h-2 bg-[#517DF3] rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredConversations.length === 0 && (
          <div className="flex items-center justify-center p-8 text-center">
            <div>
              <div className="w-12 h-12 bg-[#272C30] rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">No conversations found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsList;
```

---

## 5. ThreadView.tsx (Message Thread View)

```tsx
// src/components/admin/ThreadView.tsx

import React, { useState } from 'react';
import { Send, Paperclip, Smile, Flag, Archive, MoreHorizontal, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isAdmin: boolean;
  type?: 'text' | 'file' | 'voice' | 'system';
  attachments?: string[];
}

interface ThreadViewProps {
  selectedThread: number | null;
  messages: Message[];
  currentUser: any;
  onSendMessage: (content: string) => void;
  onFlagThread: () => void;
  onArchiveThread: () => void;
}

const ThreadView: React.FC<ThreadViewProps> = ({
  selectedThread,
  messages,
  currentUser,
  onSendMessage,
  onFlagThread,
  onArchiveThread
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedThread) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#181C20]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#517DF3] to-[#B077FF] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[#F4F5F6] mb-2">Select a conversation</h3>
          <p className="text-gray-400 text-sm max-w-md">
            Choose a conversation from the sidebar to start messaging with users. 
            You can manage support tickets, handle Pro user inquiries, and moderate content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#181C20] h-full">
      {/* Thread Header */}
      <div className="p-4 border-b border-[#272C30] bg-[#1A1E22] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback className="text-xs bg-[#272C30] text-[#F4F5F6]">
                {currentUser?.user?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-medium text-[#F4F5F6] flex items-center gap-2">
                {currentUser?.user || 'User'}
                {currentUser?.type === 'pro' && (
                  <Badge className="bg-gradient-to-r from-[#517DF3] to-[#B077FF] text-white text-xs">
                    💎 Pro
                  </Badge>
                )}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Online • {currentUser?.country || '🌍'}</span>
                {isTyping && <span className="text-[#517DF3] animate-pulse">typing...</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onFlagThread} className="h-7 w-7 text-[#F4F5F6] hover:bg-white/5">
              <Flag className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onArchiveThread} className="h-7 w-7 text-[#F4F5F6] hover:bg-white/5">
              <Archive className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#F4F5F6] hover:bg-white/5">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse">
          <div className="flex flex-col space-y-4">
            {/* Luna AI Suggestions */}
            <div className="flex justify-center">
              <div className="bg-[#272C30]/50 border border-[#517DF3]/30 rounded-lg p-3 max-w-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-[#517DF3] to-[#B077FF] rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">💡</span>
                  </div>
                  <span className="text-xs text-[#517DF3] font-medium">Luna AI Suggestion</span>
                </div>
                <p className="text-xs text-gray-300">
                  Consider offering a refund or account credit for this billing issue. This user has been a Pro member for 6 months.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="h-6 text-xs border-[#517DF3] text-[#517DF3]">
                    Use suggestion
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs text-gray-400">
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
            
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg shadow-lg ${
                    message.isAdmin
                      ? 'bg-gradient-to-r from-[#517DF3] to-[#B077FF] text-white'
                      : 'bg-[#272C30] text-[#F4F5F6] border border-[#3A3F44]'
                  } ${message.type === 'system' ? 'bg-orange-500/20 border-orange-500/30 text-orange-200' : ''}`}
                >
                  {message.type === 'system' && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-orange-300">
                      <Zap className="h-3 w-3" />
                      <span>System Message</span>
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-black/20 rounded">
                          <Paperclip className="h-3 w-3" />
                          <span className="text-xs truncate">{attachment}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${message.isAdmin ? 'text-white/70' : 'text-gray-400'}`}>
                      {message.timestamp}
                    </p>
                    {message.isAdmin && (
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-white/70 rounded-full"></div>
                        <div className="w-1 h-1 bg-white/70 rounded-full"></div>
                        <span className="text-xs text-white/70 ml-1">read</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-[#272C30] bg-[#1A1E22] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#F4F5F6] hover:bg-white/5">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              placeholder="Type your message... (Press Enter to send)"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-[#272C30] border-none text-[#F4F5F6] placeholder:text-gray-400 pr-10"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[#F4F5F6] hover:bg-white/5"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="bg-gradient-to-r from-[#517DF3] to-[#B077FF] hover:from-[#517DF3]/80 hover:to-[#B077FF]/80 text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" className="h-6 text-xs border-[#272C30] text-gray-400 hover:border-[#517DF3] hover:text-[#517DF3]">
            Refund
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs border-[#272C30] text-gray-400 hover:border-[#517DF3] hover:text-[#517DF3]">
            Escalate
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs border-[#272C30] text-gray-400 hover:border-[#517DF3] hover:text-[#517DF3]">
            Close Ticket
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThreadView;
```

---

## 6. UserMetadataPanel.tsx (User Details Sidebar in Inbox)

```tsx
// src/components/admin/UserMetadataPanel.tsx

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Clock, 
  Smartphone, 
  Monitor, 
  Globe,
  AlertTriangle,
  TrendingUp,
  Settings,
  Ban,
  UserMinus,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface UserMetadataPanelProps {
  user: any;
  threadDetails: any;
  onAction: (action: string) => void;
}

const UserMetadataPanel: React.FC<UserMetadataPanelProps> = ({
  user,
  threadDetails,
  onAction
}) => {
  const [activeTab, setActiveTab] = useState<'user' | 'thread' | 'actions'>('user');

  const getRiskScore = () => {
    // Mock risk scoring
    const score = Math.floor(Math.random() * 100);
    if (score > 70) return { score, color: 'text-red-400', bg: 'bg-red-500/20', trend: 'up' };
    if (score > 40) return { score, color: 'text-yellow-400', bg: 'bg-yellow-500/20', trend: 'stable' };
    return { score, color: 'text-green-400', bg: 'bg-green-500/20', trend: 'down' };
  };

  const riskData = getRiskScore();

  const tabs = [
    { id: 'user', label: 'User', icon: User },
    { id: 'thread', label: 'Thread', icon: Settings },
    { id: 'actions', label: 'Actions', icon: Zap }
  ];

  return (
    <div className="w-[320px] border-l border-[#272C30] bg-[#181C20] flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-[#272C30]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 p-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[#517DF3] border-b-2 border-[#517DF3] bg-[#517DF3]/5'
                : 'text-gray-400 hover:text-[#F4F5F6]'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <tab.icon className="h-3 w-3" />
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'user' && (
          <>
            {/* User Profile */}
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-3">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-[#272C30] text-[#F4F5F6] text-lg">
                  {user?.user?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold text-[#F4F5F6] mb-1">{user?.user || 'Unknown User'}</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-sm">{user?.country || '🌍'}</span>
                {user?.type === 'pro' && (
                  <Badge className="bg-gradient-to-r from-[#517DF3] to-[#B077FF] text-white text-xs">
                    💎 Pro Member
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online now</span>
              </div>
            </div>

            <Separator className="bg-[#272C30]" />

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-medium text-[#F4F5F6] mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Status
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Email</span>
                  <Badge variant="outline" className="text-xs border-green-500 text-green-500">✅ Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Phone</span>
                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">📱 Pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">WhatsApp</span>
                  <Badge variant="outline" className="text-xs border-green-500 text-green-500">✅ Active</Badge>
                </div>
              </div>
            </div>

            <Separator className="bg-[#272C30]" />

            {/* Risk Assessment */}
            <div>
              <h4 className="text-sm font-medium text-[#F4F5F6] mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Risk Score
              </h4>
              <div className={`p-3 rounded-lg ${riskData.bg} border border-current/20`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${riskData.color}`}>
                    {riskData.score}/100
                  </span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`h-3 w-3 ${riskData.color}`} />
                    <span className={`text-xs ${riskData.color}`}>{riskData.trend}</span>
                  </div>
                </div>
                <Progress value={riskData.score} className="h-2" />
                <p className="text-xs text-gray-400 mt-2">
                  Based on account age, activity patterns, and reported issues
                </p>
              </div>
            </div>

            <Separator className="bg-[#272C30]" />

            {/* Active Sessions */}
            <div>
              <h4 className="text-sm font-medium text-[#F4F5F6] mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Active Sessions
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-[#272C30] rounded-lg">
                  <Monitor className="h-4 w-4 text-blue-400" />
                  <div className="flex-1">
                    <p className="text-xs text-[#F4F5F6]">Chrome on Windows</p>
                    <p className="text-xs text-gray-400">192.168.1.100 • 2m ago</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-[#272C30] rounded-lg">
                  <Smartphone className="h-4 w-4 text-green-400" />
                  <div className="flex-1">
                    <p className="text-xs text-[#F4F5F6]">Mobile App iOS</p>
                    <p className="text-xs text-gray-400">10.0.0.1 • 1h ago</p>
                  </div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'thread' && (
          <>
            {/* Thread Information */}
            <div>
              <h4 className="text-sm font-medium text-[#F4F5F6] mb-3">Thread Details</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Type</span>
                  <Badge className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {threadDetails?.type || 'Support'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Status</span>
                  <Badge className="text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                    {threadDetails?.status || 'Open'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Priority</span>
                  <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    {threadDetails?.priority || 'Medium'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Assigned</span>
                  <span className="text-xs text-[#F4F5F6]">Admin Sarah</span>
                </div>
              </div>
            </div>

            <Separator className="bg-[#272C30]" />

            {/* SLA Timer for Pro Users */}
            {user?.type === 'pro' && (
              <>
                <div>
                  <h4 className="text-sm font-medium text-[#F4F5F6] mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    SLA Timer
                  </h4>
                  <div className="p-3 bg-gradient-to-r from-[#517DF3]/10 to-[#B077FF]/10 border border-[#517DF3]/30 rounded-lg">
                    <div className="text-center mb-2">
                      <div className="text-2xl font-bold text-[#517DF3]">18:42</div>
                      <div className="text-xs text-gray-400">remaining for first response</div>
                    </div>
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Pro SLA: 24 hours for first response
                    </p>
                  </div>
                </div>
                <Separator className="bg-[#272C30]" />
              </>
            )}

            {/* Thread Analytics */}
            <div>
              <h4 className="text-sm font-medium text-[#F4F5F6] mb-3">Analytics</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Messages</span>
                  <span className="text-xs text-[#F4F5F6]">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Duration</span>
                  <span className="text-xs text-[#F4F5F6]">2h 15m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Response Time</span>
                  <span className="text-xs text-green-400">2.3m avg</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'actions' && (
          <>
            {/* Quick Actions */}
            <div>
              <h4 className="text-sm font-medium text-[#F4F5F6] mb-3">Thread Actions</h4>
              <div className="space-y-2">
                <Button 
                  onClick={() => onAction('flag')}
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Flag Thread
                </Button>
                <Button 
                  onClick={() => onAction('archive')}
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button 
                  onClick={() => onAction('escalate')}
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Escalate to Manager
                </Button>
              </div>
            </div>

            <Separator className="bg-[#272C30]" />

            {/* User Actions */}
            <div>
              <h4 className="text-sm font-medium text-[#F4F5F6] mb-3">User Actions</h4>
              <div className="space-y-2">
                <Button 
                  onClick={() => onAction('mute')}
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Mute User (24h)
                </Button>
                <Button 
                  onClick={() => onAction('ban')}
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </Button>
                <Button 
                  onClick={() => onAction('diagnostic')}
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-green-400 border-green-500/30 hover:bg-green-500/10"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Send Diagnostic
                </Button>
              </div>
            </div>

            <Separator className="bg-[#272C30]" />

            {/* Assignment */}
            <div>
              <h4 className="text-sm font-medium text-[#F4F5F6] mb-3">Assignment</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-[#F4F5F6] border-[#272C30] hover:bg-white/5"
                >
                  <User className="h-4 w-4 mr-2" />
                  Assign to Admin
                </Button>
                <div className="text-xs text-gray-400 p-2 bg-[#272C30] rounded">
                  Currently assigned to: <span className="text-[#F4F5F6]">Admin Sarah</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserMetadataPanel;
```

---

## 7. AdminInboxSettings.tsx (Inbox Settings Modal)

```tsx
// src/components/admin/AdminInboxSettings.tsx

import React, { useState } from 'react';
import { X, Settings, Palette, Shield, MessageCircle, Users, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AdminInboxSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}

const AdminInboxSettings: React.FC<AdminInboxSettingsProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange
}) => {
  const [settings, setSettings] = useState({
    autoRefresh: true,
    readReceipts: true,
    aiSuggestions: true,
    voiceMessages: false,
    defaultSLA: '24h',
    autoPrioritize: true,
    autoAssign: true,
    flagDetection: true,
    compactMode: false
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  console.log('AdminInboxSettings: Rendering settings panel', { isOpen, settings });

  return (
    <div className="fixed inset-0 z-[999999] flex justify-end">
      <div className="bg-background border-l border-border shadow-xl w-[420px] h-screen flex flex-col max-w-[90vw]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Admin Settings</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* General Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h3 className="font-medium">General Settings</h3>
            </div>
            
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label>Auto Refresh</Label>
                <Switch
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Read Receipts</Label>
                <Switch
                  checked={settings.readReceipts}
                  onCheckedChange={(checked) => updateSetting('readReceipts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>AI Suggestions</Label>
                <Switch
                  checked={settings.aiSuggestions}
                  onCheckedChange={(checked) => updateSetting('aiSuggestions', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Voice Messages</Label>
                <Switch
                  checked={settings.voiceMessages}
                  onCheckedChange={(checked) => updateSetting('voiceMessages', checked)}
                />
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Theme</h3>
            </div>
            
            <div className="pl-6">
              <Select value={theme} onValueChange={onThemeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white-black">White & Black</SelectItem>
                  <SelectItem value="white-blue">White & Blue</SelectItem>
                  <SelectItem value="white-honey">White & Honey</SelectItem>
                  <SelectItem value="light-grey">Light Grey</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pro Support */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Pro Support</h3>
            </div>
            
            <div className="space-y-3 pl-6">
              <div className="space-y-2">
                <Label>Default SLA</Label>
                <Select 
                  value={settings.defaultSLA} 
                  onValueChange={(value) => updateSetting('defaultSLA', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 Hours</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="48h">48 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Auto-prioritize Pro Users</Label>
                <Switch
                  checked={settings.autoPrioritize}
                  onCheckedChange={(checked) => updateSetting('autoPrioritize', checked)}
                />
              </div>
            </div>
          </div>

          {/* Message Handling */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Message Handling</h3>
            </div>
            
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label>Auto-assign Messages</Label>
                <Switch
                  checked={settings.autoAssign}
                  onCheckedChange={(checked) => updateSetting('autoAssign', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Flag Detection</Label>
                <Switch
                  checked={settings.flagDetection}
                  onCheckedChange={(checked) => updateSetting('flagDetection', checked)}
                />
              </div>
            </div>
          </div>

          {/* View Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <h3 className="font-medium">View Settings</h3>
            </div>
            
            <div className="pl-6">
              <div className="flex items-center justify-between">
                <Label>Compact Mode</Label>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button onClick={onClose} className="w-full">
            <Check className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminInboxSettings;
```

---

## Summary

This export includes:
1. **MessageDropdown.tsx** - The messages button with badge and dropdown popup
2. **AdminHeader Notification Button** - The Bell icon button with notification count
3. **AdminInbox.tsx** - The full inbox window that opens from messages (compact/sidebar/fullscreen modes)
4. **ConversationsList.tsx** - The conversations list in the inbox
5. **ThreadView.tsx** - The message thread view in the inbox
6. **UserMetadataPanel.tsx** - The user details sidebar in the inbox
7. **AdminInboxSettings.tsx** - The inbox settings modal

All code is 100% exact from the project.
