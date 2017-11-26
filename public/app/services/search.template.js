import algoliasearch from 'algoliasearch';
import Injectable from 'utils/injectable';

const client = algoliasearch('%ALGOLIA_APP_ID%', '%ALGOLIA_SEARCH_API%');
const index = client.initIndex('%ALGOLIA_INDEX%');

class Search extends Injectable {
  constructor(...injections) {
    super(Search.$inject, injections);
    this.isVisible = false;
    this.results = [];
  }

  getResults() {
    return this.results;
  }

  hide() {
    this.isVisible = false;
  }

  search(query) {
    if (query) {
      query = query.toString();
    }

    if (query.length < 3) {
      this.hide();
      this.results = [];
      return;
    }

    index.search({ query }, (err, content) => {
      if (err) {
        console.error(err);
        return;
      }

      const results = content.hits.map(result => ({ text: result.name }));
      this.results = results;
      this.show();
    });

    /*
    this.API.get(`/search?q=${query}`)
      .then(res => {
        const { data } = res;
        const { results } = data;
        this.results = results;
      })
      .catch(err => this.AlertsService.push('error', err.message || err.data));
    */
  }

  show() {
    this.isVisible = this.results.length > 0;
  }
}

Search.$inject = [
  'AlertsService',
  'API',
];

export default Search;
