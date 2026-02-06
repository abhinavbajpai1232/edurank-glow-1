import { Phone, PhoneOff } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface IncomingCallDialogProps {
  open: boolean;
  callerName: string;
  onAnswer: () => void;
  onReject: () => void;
}

const IncomingCallDialog = ({ open, callerName, onAnswer, onReject }: IncomingCallDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm text-center" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <Avatar className="h-20 w-20 animate-pulse">
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                {callerName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-success flex items-center justify-center animate-bounce">
              <Phone className="h-3 w-3 text-success-foreground" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">{callerName}</h3>
            <p className="text-sm text-muted-foreground">Incoming video call...</p>
          </div>

          <div className="flex gap-6 mt-2">
            <Button
              variant="destructive"
              size="icon"
              className="h-14 w-14 rounded-full"
              onClick={onReject}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-14 w-14 rounded-full bg-success hover:bg-success/90"
              onClick={onAnswer}
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallDialog;
