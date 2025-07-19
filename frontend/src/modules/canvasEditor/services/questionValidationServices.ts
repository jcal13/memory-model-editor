import axios from 'axios'
import { CanvasElement } from '../shared/types'
import { buildJSONFromElements } from '../jsonConversion/jsonBuilder'

const API_DEV_URL = 'http://localhost:3001'

export async function submitCanvas(elements: CanvasElement[]) {
  const payload = buildJSONFromElements(elements)
  // console.log(payload)
  const response = await axios.post(
    `${API_DEV_URL}/canvasEditor/submit`,
    payload
  )
  return response.data
}
