import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export const useVideoCall = () => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [currentCalleeId, setCurrentCalleeId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; callerName: string } | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setCurrentCalleeId(null);
    setIncomingCall(null);
  }, [localStream]);

  // Listen for incoming calls
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `callee_id=eq.${user.id}`,
        },
        async (payload) => {
          const signal = payload.new as any;
          if (signal.signal_type === 'offer' && callState === 'idle') {
            // Fetch caller profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', signal.caller_id)
              .maybeSingle();

            setIncomingCall({
              callerId: signal.caller_id,
              callerName: profile?.name || 'Unknown',
            });
            setCallState('ringing');
          } else if (signal.signal_type === 'answer' && callState === 'calling') {
            // Handle answer
            const answer = signal.signal_data;
            if (pcRef.current) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
              setCallState('connected');
            }
          } else if (signal.signal_type === 'ice-candidate') {
            if (pcRef.current) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.signal_data));
              } catch (e) {
                console.error('Error adding ICE candidate:', e);
              }
            }
          } else if (signal.signal_type === 'call-end') {
            toast.info('Call ended');
            cleanup();
          } else if (signal.signal_type === 'call-reject') {
            toast.info('Call declined');
            cleanup();
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [user, callState, cleanup]);

  // Also listen for signals where we are the caller (for ICE candidates from callee)
  useEffect(() => {
    if (!user || !currentCalleeId) return;

    const channel = supabase
      .channel(`calls-from-${currentCalleeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `caller_id=eq.${currentCalleeId}`,
        },
        async (payload) => {
          const signal = payload.new as any;
          if (signal.callee_id !== user.id) return;

          if (signal.signal_type === 'ice-candidate') {
            if (pcRef.current) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.signal_data));
              } catch (e) {
                console.error('Error adding ICE candidate:', e);
              }
            }
          } else if (signal.signal_type === 'answer') {
            if (pcRef.current) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
              setCallState('connected');
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, currentCalleeId]);

  const createPeerConnection = useCallback((targetUserId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = async (event) => {
      if (event.candidate && user) {
        await supabase.from('call_signals').insert({
          caller_id: user.id,
          callee_id: targetUserId,
          signal_type: 'ice-candidate',
          signal_data: event.candidate.toJSON(),
        } as any);
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [user, cleanup]);

  const startCall = async (calleeId: string) => {
    if (!user) return;
    try {
      setCallState('calling');
      setCurrentCalleeId(calleeId);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      const pc = createPeerConnection(calleeId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await supabase.from('call_signals').insert({
        caller_id: user.id,
        callee_id: calleeId,
        signal_type: 'offer',
        signal_data: offer,
      } as any);

      toast.info('Calling...');
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call. Check camera/mic permissions.');
      cleanup();
    }
  };

  const answerCall = async () => {
    if (!user || !incomingCall) return;
    try {
      setCurrentCalleeId(incomingCall.callerId);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      const pc = createPeerConnection(incomingCall.callerId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Get the offer
      const { data: offerSignals } = await supabase
        .from('call_signals')
        .select('*')
        .eq('caller_id', incomingCall.callerId)
        .eq('callee_id', user.id)
        .eq('signal_type', 'offer')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!offerSignals?.length) {
        toast.error('Call offer not found');
        cleanup();
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offerSignals[0].signal_data as any));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await supabase.from('call_signals').insert({
        caller_id: user.id,
        callee_id: incomingCall.callerId,
        signal_type: 'answer',
        signal_data: answer,
      } as any);

      setCallState('connected');
      setIncomingCall(null);
    } catch (error) {
      console.error('Error answering call:', error);
      toast.error('Failed to answer call');
      cleanup();
    }
  };

  const rejectCall = async () => {
    if (!user || !incomingCall) return;
    await supabase.from('call_signals').insert({
      caller_id: user.id,
      callee_id: incomingCall.callerId,
      signal_type: 'call-reject',
      signal_data: {},
    } as any);
    cleanup();
  };

  const endCall = async () => {
    if (!user || !currentCalleeId) {
      cleanup();
      return;
    }
    await supabase.from('call_signals').insert({
      caller_id: user.id,
      callee_id: currentCalleeId,
      signal_type: 'call-end',
      signal_data: {},
    } as any);
    cleanup();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => {
        t.enabled = !t.enabled;
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => {
        t.enabled = !t.enabled;
      });
    }
  };

  return {
    callState,
    localStream,
    remoteStream,
    incomingCall,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    cleanup,
  };
};
