import pandas as pd
import json
import unicodedata
import networkx as nx

CORPORATION_JSON = "./static/company_data.json"
DONATION_CSV = "./static/donations.csv"

#Clean data
def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return ''.join([c for c in nfkd_form if not unicodedata.combining(c)]) 

def transform_individual(individual):

    c_individual = individual
    c_individual['first_name'] = remove_accents(individual['first_name'].lower().strip()) if individual['first_name'] else None
    c_individual["last_name"] = remove_accents(individual['last_name'].lower().strip()) if individual['last_name'] else None
    c_individual["sur_name"] = remove_accents(individual['sur_name'].lower().strip()) if individual['sur_name'] else None

    return c_individual
    
def transform_corporation(corporation):
    c_corp = corporation
    c_corp['name'] = remove_accents(corporation['name'].lower().strip())
    return c_corp


def clean_entry(entry):
    if entry['type'] == "corporation":
        c_entry = transform_corporation(entry)
        return c_entry
    else :
        c_entry = transform_individual(entry)
        return c_entry

def clean_incorporators(incorporator_list):
    incorporators = []
    for incorporator in incorporator_list:
        incorp_entry = clean_entry(incorporator)
        incorporators.append(incorp_entry)
    return incorporators

def clean_officers(officer_list):
    officers = []
    for officer in officer_list:
        position = officer['position']
        officer['type'] = 'individual'
        officers.append(clean_entry(officer))
    return officers 


def transform_corporation_data(corporation_object_list):
    clean_corporation_objects = []
    for corporation in corporation_object_list:
        rs_agent = clean_entry(corporation['resident_agent'])

        officers = None
        incorporators = None
        if 'officers' in corporation:
            officers = clean_officers(corporation['officers'])
        if 'incorporators' in corporation:
            incorporators = clean_incorporators(corporation['incorporators'])
        corporation['resident_agent'] = rs_agent
        corporation["officers"] = officers
        corporation['incorporators'] = incorporators

        clean_corporation_objects.append(corporation)
    return clean_corporation_objects

def filter_executives(corporation_list):
    resident_agents = []
    officer_list = []
    incorporator_list = []
    for corporation in corporation_list:
        d = {
            "corp_name": corporation["name"],
            "business_entity_id": corporation["business_entity_id"],
            "registration_number": corporation["registration_number"],
            "registration_index": corporation["registration_index"]
        }
        resident_agent = {**d, **corporation['resident_agent']}
        resident_agents.append(resident_agent)

        if corporation['officers']:
            d['officers'] = corporation['officers']
            officer_list.append(d) 
        
        if corporation["incorporators"]:
            d['incorporators'] = corporation['incorporators']
            incorporator_list.append(d)
    return resident_agents, officer_list, incorporator_list


def update_entry(name, entry, individual_entries, entry_type='individual'):
    # TODO: Fix case where same key has individual and organization types 
    if f'{entry_type}_entity_ids' in individual_entries[name].keys():
        individual_entries[name][f'{entry_type}_entity_ids'].append(entry[f'{entry_type}_entity_id'])
        individual_entries[name][f'{entry_type}_name_ids'].append(entry[f"{entry_type}_name_id"])
        individual_entries[name]['entity_ids'].append(entry["entity_id"])
        individual_entries[name]['corporations'].append({
            "corp_name": entry['corp_name'],
            "business_entity_id": entry["business_entity_id"],
            'registration_number': entry['registration_number'],
            "registration_index": entry["registration_index"]
            })
    
    return individual_entries

def create_entry(name, entry, individual_entries, entry_type="individual"):
    individual_entries[name] = {
        f"{entry_type}_entity_ids": [entry[f"{entry_type}_entity_id"]],
        f"{entry_type}_name_ids": [entry[f"{entry_type}_name_id"]],
        "entity_ids": [entry["entity_id"]],
        "type": entry['type'],
        "corporations": [{
            "corp_name": entry['corp_name'],
            "business_entity_id": entry["business_entity_id"],
            'registration_number': entry['registration_number'],
            "registration_index":  entry["registration_index"]
            }]
        }
    return individual_entries

def prepare_individual_agents(rs_agent, individual_agents):
    agent_name = rs_agent['first_name'] + " " + rs_agent["last_name"] + (" "+ rs_agent["sur_name"] if rs_agent["sur_name"] else "")
    if agent_name in individual_agents.keys():
        individual_agents = update_entry(agent_name, rs_agent, individual_agents, entry_type='individual')
    else :
        individual_agents = create_entry(agent_name, rs_agent, individual_agents, entry_type='individual')
    return individual_agents

def prepare_corporation_agents(rs_agent, individual_agents):
    if rs_agent["name"] in individual_agents.keys():
        individual_agents = update_entry(rs_agent['name'], rs_agent, individual_agents, entry_type='organization')
    else :
        individual_agents = create_entry(rs_agent['name'], rs_agent, individual_agents, entry_type='organization')
    return individual_agents


def prepare_agents(resident_agents):
    individual_agents = {}
    corporation_agents = {}
    for rs_agent in resident_agents:
        if rs_agent['type'] == 'individual':
            individual_agents = prepare_individual_agents(rs_agent, individual_agents)
        else :
            corporation_agents = prepare_corporation_agents(rs_agent, corporation_agents)

    return individual_agents, corporation_agents


def prepare_officer_entry(officers, individual_officers):
    for officer in officers["officers"]:
        officer["corp_name"]= officers['corp_name']
        officer["business_entity_id"] = officers["business_entity_id"]
        officer['registration_number'] = officers['registration_number']
        officer["registration_index"]= officers["registration_index"]
        officer_name = officer['first_name'] + " " + officer["last_name"] + (" "+ officer["sur_name"] if officer["sur_name"] else "")

        if officer_name in individual_officers.keys():
            individual_officers = update_entry(officer_name, officer, individual_officers)
        else :
            individual_officers = create_entry(officer_name, officer, individual_officers)

    return individual_officers

def prepare_officers(officer_list):
    individual_officers = {}
    for officers in officer_list:
        individual_officers = prepare_officer_entry(officers, individual_officers)
    return individual_officers 

def prepare_incorporator_entry(incorporators, individual_incorporators):
    
    for incorporator in incorporators['incorporators']:
        incorporator["corp_name"]= incorporators['corp_name']
        incorporator["business_entity_id"] = incorporators["business_entity_id"]
        incorporator['registration_number'] = incorporators['registration_number']
        incorporator["registration_index"]= incorporators["registration_index"]
        
        if incorporator['type'] == 'individual':    
            incorporator_name = incorporator['first_name'] + " " + incorporator["last_name"] + (" "+ incorporator["sur_name"] if incorporator["sur_name"] else "")
            if incorporator_name in individual_incorporators.keys():
                individual_incorporators = update_entry(incorporator_name, incorporator, individual_incorporators)
            else :
                individual_incorporators = create_entry(incorporator_name, incorporator, individual_incorporators)
        else :
            if incorporator['name'] in individual_incorporators.keys():
                individual_incorporators = update_entry(incorporator['name'], incorporator, individual_incorporators, entry_type='organization')
            else :
                individual_incorporators = create_entry(incorporator['name'], incorporator, individual_incorporators, entry_type='organization')

    return individual_incorporators

def prepare_incorporators(incorporator_list):
    individual_incorporators = {}
    for incorporators in incorporator_list:
        individual_incorporators = prepare_incorporator_entry(incorporators, individual_incorporators)
    return individual_incorporators

def foo(corp_agents, node_ids, ids):
    for corp_name, corp_agent in corp_agents.items():
        if not corp_name in node_ids.keys():
            node_ids[corp_name] = ids
            ids += 1            
        for corp in corp_agent['corporations']:
            if not corp['corp_name'] in node_ids.keys():
                node_ids[corp['corp_name']] = ids
                ids += 1
                

    return node_ids, ids

def generate_node_ids(entity_list):
    node_ids = {}
    ids = 0
    for data in entity_list:
        node_ids, ids = foo(data, node_ids, ids)
    return node_ids


def add_nodes_edges(G, entity_list, node_ids, edge_type="agent"):
    for entity_name, entity_data in entity_list.items():
        entity_id = node_ids[entity_name]  
        d = {
            "id": entity_id,
            "label": entity_name,
            "value": "corporation" if entity_data['type'] == "corporation" else "individual", 
            "registration_index": "",
            "registration_number": "",
            "business_entity_id": ""
        }
        G.add_node(entity_id, **d)

        for client in entity_data['corporations']:
            client_id = node_ids[client['corp_name']]
            d = {
                "id": client_id,
                "label": client['corp_name'],
                "value": 'corporation',
                "registration_index": client["registration_index"],
                "registration_number": client["registration_number"],
                "business_entity_id": client['business_entity_id']    
                
            }
            G.add_node(client_id, **d)
            e = {
                "source": entity_id,
                "target": client_id,
                "label": edge_type,
                # What do?
                "weigth": 10,
            }
            G.add_edge(
                entity_id,
                client_id,
                **e
            )
    return G

def main():
    # TODO: 
    # 0. Refactor code into modules
    # 1. Improve matching to consider cases where one last name vs two last name
    # 2. Integrate donations into the pipeline
    # 3. Integrate contracts into the pipeline
    # 4. Integrate government agencies into the pipeline

    with open(CORPORATION_JSON, 'r') as f:
        corporation_object_list = json.loads(f.read())

    clean_corporation_objects = transform_corporation_data(corporation_object_list)

    resident_agents, officer_list, incorporator_list = filter_executives(clean_corporation_objects)

    individual_agents, corporation_agents = prepare_agents(resident_agents)    
    individual_officers = prepare_officers(officer_list)
    individual_incorporators = prepare_incorporators(incorporator_list)

    entity_list = [individual_agents, corporation_agents, individual_officers, individual_incorporators]
    node_ids = generate_node_ids(entity_list)

    G = nx.Graph()
    G = add_nodes_edges(G, individual_agents, node_ids)
    G = add_nodes_edges(G, corporation_agents, node_ids)
    G = add_nodes_edges(G, individual_officers, node_ids, edge_type="officer")
    G = add_nodes_edges(G, individual_incorporators, node_ids, edge_type="incorporator")
    # Get path from variable
    nx.write_graphml(G, "./public/graph.graphml")

if __name__ == "__main__":
    main()