import { SectionId } from '../../types/meeting'
import SegueSection from './sections/SegueSection'
import ScorecardSection from './sections/ScorecardSection'
import RocksSection from './sections/RocksSection'
import HeadlinesSection from './sections/HeadlinesSection'
import TodosSection from './sections/TodosSection'
import IDSSection from './sections/IDSSection'
import ConcludeSection from './sections/ConcludeSection'

const SECTION_COMPONENTS: Record<SectionId, React.ComponentType> = {
  segue: SegueSection,
  scorecard: ScorecardSection,
  rocks: RocksSection,
  headlines: HeadlinesSection,
  todos: TodosSection,
  ids: IDSSection,
  conclude: ConcludeSection,
}

interface Props {
  sectionId: SectionId
}

export default function SectionShell({ sectionId }: Props) {
  const Component = SECTION_COMPONENTS[sectionId]
  if (!Component) return null

  return (
    <div className="flex-1 animate-fade-in">
      <Component />
    </div>
  )
}
