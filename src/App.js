import React, {useEffect} from "react";

import ElasticsearchAPIConnector from "@elastic/search-ui-elasticsearch-connector";
import "@elastic/react-search-ui-views/lib/styles/styles.css";

import {
  ErrorBoundary,
  Facet,
  SearchProvider,
  SearchBox,
  Results,
  PagingInfo,
  ResultsPerPage,
  Paging,
  Sorting,
  WithSearch
} from "@elastic/react-search-ui";
import { Layout } from "@elastic/react-search-ui-views";
import "@elastic/react-search-ui-views/lib/styles/styles.css";

import {
  buildAutocompleteQueryConfig,
  buildFacetConfigFromConfig,
  buildSearchOptionsFromConfig,
  buildSortOptionsFromConfig,
  getConfig,
  getFacetFields
} from "./config/config-helper";

const { hostIdentifier, searchKey, endpointBase, engineName } = getConfig();
const connector = new ElasticsearchAPIConnector(
  {
    cloud: {
      id: "CDL_AML:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvOjQ0MyRkNThhMGFhMGQzZWU0MTU5OGRhOGMxMTQ3NDQ2ZDU4NiQ0NTAxM2Y1N2QxMDg0MzBiYWQwZjQ2MTgxOTcwNDllYg=="
    },
    apiKey: "ZGFDN05Jd0JZbHlZNm1kd1VHTkE6bEZrUzBQOGFRX3FLdGgzYkRzZHMtUQ==",
    index: ["aml-mas", "aml-adhoc", "aml-dj"]
  },
  (requestBody, requestState, queryConfig) => {
    console.log("postProcess requestBody Call", requestBody); // logging out the requestBody before sending to Elasticsearch
    requestBody.min_score = 0
    if (!requestState.searchTerm) return requestBody;
    
    console.log(queryConfig)
    
    const wordsCount = requestState.searchTerm.split(/\s+/).length;

    requestBody.query = {
      multi_match: {
        query: requestState.searchTerm,
        fields: [
          `person.english_name.*^${wordsCount}`,
          `entity.english_name.*^${wordsCount}`,
          `dataid^300`
        ]
      }
    };
    return requestBody;
  }
);

const config = {
  debug: true,
  alwaysSearchOnInitialLoad: true,
  apiConnector: connector,
  hasA11yNotifications: true,
  searchQuery: {
    filters: [],
    search_fields: {
      english_name: {
        weight: 3
      },
      dataid: {}
    },
    result_fields: {
      type: { snippet : {} },
      dataid : { raw: {} },
      entity: { raw: {} },
      person: { raw: {} },
      mas : { raw: {} },
      adhoc : { raw: {} },
      dj : { raw: {} },
    },
    facets: {
      "type": { type: "value", size: 10 },
      "person.citizenship": { type: "value", size: 10 },
      "person.gender": { type: "value", size: 10 },
    }
  },
  disjunctiveFacets: ["type", "person.citizenship"],
};

const CustomResultView = ({
  result,
  onClickLink
}: {
  result: SearchResult;
  onClickLink: () => void;
}) => {
  const fieldOrder = ['score', 'dataid', 'type', 'person', 'entity', 'mas', 'adhoc', 'dj'];

  return (
    <li className="sui-result">
      <div className="sui-result__body">
        <div className="sui-result__details">
          {fieldOrder.map((key) => (
            <div key={key}>
              {key === 'score' ? (
                result._meta?.rawHit?._score ? (
                  <React.Fragment>
                    <span className="sui-result__key">{key}</span>
                    <span className="sui-result__value">{result._meta.rawHit._score}</span>
                  </React.Fragment>
                ) : null
              ) : (
                result[key] && (
                  <React.Fragment>
                    <span className="sui-result__key">{key}</span>
                    {typeof result[key].raw === 'object' ? (
                      <pre style={{ backgroundColor: "#f1f4fa", padding: "10px", whiteSpace: "pre-wrap", marginTop: "0px" }}>{JSON.stringify(result[key].raw, null, 2)}</pre>
                    ) : (
                      <span className="sui-result__value">{result[key].raw}</span>
                    )}
                  </React.Fragment>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </li>
  );
}

export default function App() {
  return (
    <SearchProvider config={config}>
      <WithSearch mapContextToProps={({ wasSearched }) => ({ wasSearched })}>
        {({ wasSearched }) => {
          return (
            <div className="App">
              <ErrorBoundary>
                <Layout
                  header={ <SearchBox autocompleteSuggestions={false} />}
                  sideContent={
                    <React.Fragment>
                      <Facet field={"type"} label={"type"} />
                      <Facet field={"person.citizenship"} label={"Citizenship"} />
                      <Facet field={"person.gender"} label={"Gender"} />
                    </React.Fragment>
                  }
                  bodyContent={
                    <React.Fragment>
                      <Results resultView={CustomResultView}/>
                    </React.Fragment>
                  }
                />
              </ErrorBoundary>
            </div>
          );
        }}
      </WithSearch>
    </SearchProvider>
  );
}

