import Linkify from "react-linkify";
import { map, startCase } from "lodash";
import { DEFAULT_LINKIFY_PROPS } from "../../../lib/consts";


export const NodeInformation = ({nodeType, filteredAttributes}:any) => {
  delete filteredAttributes.value;

  const displayedValues = {
    "description": "Descripcion",
    "ley_habilitadora": "Ley Habilitadora",
    "registration_number": "Numero de Registro", 
    "corp_category": "Tipo de Corporacion",
    "documento": "Documento"
  }
  const cleanAttributes = {}
  for (const [key, value] of Object.entries(filteredAttributes)){
    if(Object.keys(displayedValues).includes(key)){
      if(value !== "NaN" || !value){
        const cleanKey = displayedValues[key]
        cleanAttributes[cleanKey] = value.toString()
      }
     
    }
    
  }

  switch(nodeType) {
    case 'corporation':
      return (map(cleanAttributes, (value, key) => (
        <div className="profile-data">
            <h2 key={key} className="fs-5 ellipsis">
                <small className="text-muted">{startCase(key)}:</small>{" "}
                <span title={value}>
                    {typeof value === "number" ? value.toLocaleString() : <Linkify {...DEFAULT_LINKIFY_PROPS}>{value}</Linkify>}
                </span>
            </h2>
        </div>
       
      )))
    case 'government_entity':
        delete cleanAttributes['Numero de Registro']
        return (map(cleanAttributes, (value, key) => (
          <div className="profile-data">
            <h2 key={key} className="fs-5 ellipsis">
              <small className="text-muted">{startCase(key)}:</small>{" "}
              <span title={value}>
                {typeof value === "number" ? value.toLocaleString() : <Linkify {...DEFAULT_LINKIFY_PROPS}>{value}</Linkify>}
              </span>
            </h2>
          </div>

          )))
    default:
      return null;
  }
}