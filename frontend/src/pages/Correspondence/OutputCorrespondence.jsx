import CorrespondencePage from './CorrespondencePage'
import { outputCorrespondenceService } from '../../services/correspondenceService'

const OutputCorrespondence = () => (
  <CorrespondencePage
    titleKey="correspondence.outputTitle"
    createTitleKey="correspondence.createOutput"
    service={outputCorrespondenceService}
    queryKey="output-correspondence"
  />
)

export default OutputCorrespondence
