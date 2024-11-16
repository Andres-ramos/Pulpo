import pandas as pd
import json
from fuzzywuzzy import fuzz 


GRAPH_JSON = "./static/graph.json"
ARTAU_CSV = "./static/artau.csv"
DONATION_CSV = "./static/donations.csv"

def main():
    df = pd.read_csv(ARTAU_CSV)
    donation_df = pd.read_csv(DONATION_CSV)
    donation_df = donation_df[donation_df["Aseguradora"] == "First Medical"]
    donation_df["Nombre"] = donation_df["Nombre"].str.lower()
    # print(donation_df)
    # Combine names
    df["name"] = generate_names(df)
    # Map names to equal names 
    df['name'] = df['name'].str.lower()
    name_mapper = {
        'carmen feliciano vargas': 'carmen feliciano vargas',
        'carmen feliciano': 'carmen feliciano vargas',
        'karen artau feliciano': 'karen artau feliciano',
        'karen artau': 'karen artau feliciano',
        'eduardo artau gomez': 'eduardo artau gomez',
        'hector galarza': 'hector galarza',
        'vivian solivan': 'vivian solivan melendez',
        'alexis cardona': 'alexis cardona',
        'francisco pares alicea': 'francisco pares alicea',
        'patricia serrano': 'patricia serrano',
        'francisco artau feliciano': 'francisco artau feliciano',
        'marcos feliciano juarbe': 'marcos feliciano juarbe',
        'eduardo artau': 'eduardo artau gomez',
        'francisco artau': 'francisco artau feliciano',
        'juan dominguez': 'juan dominguez',
        "eduardo artau feliciano": "eduardo artau feliciano",
        'viavian solivan melendez': "vivian solivan melendez"
    }
    df["name"]= df["name"].apply(lambda name: name_mapper[name])


    donation_df["Nombre"] = donation_df["Nombre"].apply(lambda name: name_mapper[name])
    node_df = generate_node_df(df, donation_df)    
    edge_df = generate_edge_df(df, donation_df, node_df)

    nodes = []
    edges = []

    for index, row in node_df.iterrows():
        nodes.append({
            "id": index, 
            "label": row["Label"], 
            "value": row["Value"]
            }
        )

    for index, row in edge_df.iterrows():
        if row["Label"] == "familia":
            weight = 10
        elif row["Label"] == "partido":
            weight = 0.001
        else :
            weight = 1

        edge = {
            "id": index,
            "source": row["Source"],
            "target": row["Target"],
            "label": row["Label"],
            "weight": weight,
            "extra": row["Extra"]
        }
        edges.append(edge)

    grafo_dict = {"nodes": nodes, "edges": edges}
    with open(GRAPH_JSON, 'w') as fp:
        json.dump(grafo_dict, fp)

def generate_names(df):

    names = []
    for _, row in df.iterrows():
        first_name = row[0]
        last_name = row[1]
        sur_name = row[2]
        individual = f"{first_name.strip()} {last_name.strip()} {sur_name if sur_name == sur_name else ''}"
        names.append(individual.strip())

    return names

def generate_node_df(df, donation_df):
    corporations = list(df["corportion"].unique())
    political_entities = list(donation_df["Candidato politico"].unique())
    individuals = set(list(df["name"].unique()) + list(donation_df["Nombre"].unique()))

    labels = [corp for corp in corporations] + [politician for politician in political_entities] + [individual for individual in individuals ]
    
    values = ["corporation"]*len(corporations) + ["political_entity"]*len(political_entities) + ["individual"]*len(individuals)

    return pd.DataFrame({"Label": labels, "Value": values})


def generate_edge_df(df, donation_df, node_df):

    sources = []
    targets = []
    kinds = []
    labels = []
    extras = []
    
    for index, row in df.iterrows():

        name, position, corporation = row[-1], row[3], row[-2]
        source_id = node_df[node_df["Label"] == name].index[0]
        target_id = node_df[node_df["Label"] == corporation].index[0]
        kind = position 

        sources.append(source_id)
        targets.append(target_id)
        kinds.append(kind)
        labels.append(kind)
        extras.append("")

    for index, row in donation_df.iterrows():
        name, politician, amount, date = row[0], row[4], row[-1], row[3]

        source_id = node_df[node_df["Label"] == name].index[0]
        target_id = node_df[node_df["Label"] == politician].index[0]
        kind = "donation"
        
        sources.append(source_id)
        targets.append(target_id)
        kinds.append(kind)
        labels.append(kind)
        extras.append(
            {
                "amount":amount,
                "date": date
            }
        )

    artau_list = list(node_df[node_df["Label"].str.contains("artau")]["Label"]) + ['carmen feliciano vargas']
    artau_sources, artau_targets, artau_kinds, artau_labels = generate_cluster(node_df, artau_list ,"familia")
    sources += artau_sources
    targets += artau_targets
    kinds += artau_kinds
    labels += artau_labels
    extras += [""]*len(artau_sources)

    # pnp_list = list(donation_df[donation_df["Partido"] == "PNP"]["Candidato politico"])
    # pnp_sources, pnp_targets, pnp_kinds, pnp_labels = generate_cluster(node_df, pnp_list ,"partido")
    # sources += pnp_sources
    # targets += pnp_targets
    # kinds += pnp_kinds
    # labels += pnp_labels

    # ppd_list = list(donation_df[donation_df["Partido"] == "PPD"]["Candidato politico"])
    # ppd_sources, ppd_targets, ppd_kinds, ppd_labels = generate_cluster(node_df, ppd_list ,"partido")
    # sources += ppd_sources
    # targets += ppd_targets
    # kinds += ppd_kinds
    # labels += ppd_labels

    

    return pd.DataFrame({
        "Source": sources, 
        "Target": targets, 
        "Kind": kinds, 
        "Label": labels,
        "Type": ["Undirected"]*len(sources),
        "Extra": extras
    })


def generate_cluster(node_df, node_list, edge_label):
    sources, targets, kinds, labels = [], [], [], []

    for i in range(len(node_list)):
        # for j in range(i + 1, len(node_list)):
        source_name = node_list[i]
        target_name = node_list[(i + 1)%len(node_list)]
        source_id = node_df[node_df["Label"] == source_name].index[0]
        target_id = node_df[node_df["Label"] == target_name].index[0]
        kind = edge_label

        sources.append(source_id)
        targets.append(target_id)
        kinds.append(kind)
        labels.append(kind)

    return sources, targets, kinds, labels

if __name__ == "__main__":
    main()