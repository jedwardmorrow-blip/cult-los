import { useParams, useNavigate } from 'react-router-dom'
import { MeetingProvider } from '../../hooks/useMeetingRoom'
import MeetingRoom from '../../components/meeting/MeetingRoom'

export default function MeetingRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  if (!roomId) {
    navigate('/rooms')
    return null
  }

  return (
    <MeetingProvider roomId={roomId}>
      <MeetingRoom />
    </MeetingProvider>
  )
}
