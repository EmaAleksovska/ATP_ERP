import CorrespondencePage from './CorrespondencePage'
import { inputCorrespondenceService } from '../../services/correspondenceService'

const InputCorrespondence = () => (
  <CorrespondencePage
    titleKey="correspondence.inputTitle"
    createTitleKey="correspondence.createInput"
    service={inputCorrespondenceService}
    queryKey="input-correspondence"
  />
)

export default InputCorrespondence
