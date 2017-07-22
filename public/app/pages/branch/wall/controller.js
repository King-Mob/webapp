import Injectable from 'utils/injectable';

class BranchWallController extends Injectable {
  constructor(...injections) {
    super(BranchWallController.$inject, injections);

    const cache = this.LocalStorageService.getObject('cache').branchWallPosts || {};

    this.controls = {
      postType: {
        items: [
          'all',
          'images',
          'videos',
          'audio',
          'text',
          'pages',
          'polls',
        ],
        selectedIndex: 0,
      },
      sortBy: {
        items: [
          'total points',
          '# of comments',
          'date posted',
        ],
        selectedIndex: 2,
      },
      statType: {
        items: [
          'global',
          'local',
          'branch',
        ],
        selectedIndex: 0,
      },
      timeRange: {
        items: [
          'all time',
          'past year',
          'past month',
          'past week',
          'past 24 hrs',
          'past hour',
        ],
        selectedIndex: 0,
      },
    };
    this.isLoading = false;
    // To stop sending requests once we hit the bottom of posts.
    this.lastFetchedPostId = false;
    this.posts = cache[this.BranchService.branch.id] || [];

    this.callbackDropdown = this.callbackDropdown.bind(this);
    this.callbackLoad = this.callbackLoad.bind(this);
    this.callbackScroll = this.callbackScroll.bind(this);
    this.getPosts = this.getPosts.bind(this);
    this.getPostType = this.getPostType.bind(this);
    this.getSortBy = this.getSortBy.bind(this);
    this.getStatType = this.getStatType.bind(this);
    this.getTimeafter = this.getTimeafter.bind(this);

    const listeners = [];
    listeners.push(this.$rootScope.$watch(() => this.controls.postType.selectedIndex, this.callbackDropdown));
    listeners.push(this.$rootScope.$watch(() => this.controls.sortBy.selectedIndex, this.callbackDropdown));
    listeners.push(this.$rootScope.$watch(() => this.controls.statType.selectedIndex, this.callbackDropdown));
    listeners.push(this.$rootScope.$watch(() => this.controls.timeRange.selectedIndex, this.callbackDropdown));
    listeners.push(this.EventService.on(this.EventService.events.CHANGE_BRANCH_PREFETCH, this.callbackLoad));
    listeners.push(this.EventService.on(this.EventService.events.SCROLLED_TO_BOTTOM, this.callbackScroll));
    this.$scope.$on('$destroy', () => listeners.forEach(deregisterListener => deregisterListener()));
  }

  callbackDropdown(newValue, oldValue) {
    if (newValue !== oldValue) this.callbackLoad();
  }

  callbackLoad() {
    return new Promise((resolve, reject) => {
      if (!this.$state.current.name.includes('weco.branch.wall')) {
        return reject();
      }

      return this.getPosts();
    });
  }

  callbackScroll(name) {
    if ('WallScrollToBottom' === name) this.getPosts(this.posts[this.posts.length - 1].id);
  }

  // return the correct ui-sref string for when the specified post is clicked
  getLink(post) {
    if (post.type === 'text' || post.type === 'poll') {
      return this.$state.href('weco.branch.post', { postid: post.id });
    }

    return post.text;
  }

  getPosts(lastPostId) {
    return new Promise((resolve, reject) => {
      let posts = this.posts;

      if (this.isLoading === true || lastPostId === this.lastFetchedPostId) {
        return resolve();
      }

      this.isLoading = true;

      if (lastPostId) {
        this.lastFetchedPostId = lastPostId;
      }

      const postType = this.getPostType();
      const sortBy = this.getSortBy();
      const statType = this.getStatType();
      const timeafter = this.getTimeafter();

      // fetch the posts for this branch and timefilter
      this.BranchService.getPosts(this.BranchService.branch.id, timeafter, sortBy, statType, postType, lastPostId, false)
        .then(newPosts => this.$timeout(() => {
          // If lastPostId was specified, we are fetching more posts, so append them.
          posts = lastPostId ? posts.concat(newPosts) : newPosts;
          this.posts = posts;

          // 30 is the length of the posts response sent back by server.
          if (newPosts.length > 0 && newPosts.length < 30) {
            this.lastFetchedPostId = newPosts[newPosts.length - 1].id;
          }

          let cache = this.LocalStorageService.getObject('cache');
          cache.branchWallPosts = cache.branchWallPosts || {};
          cache.branchWallPosts[this.BranchService.branch.id] = this.posts.slice(0, 30);
          this.LocalStorageService.setObject('cache', cache);

          this.isLoading = false;
          return resolve();
        }))
        .catch(() => {
          this.AlertsService.push('error', 'Error fetching posts.');
          this.isLoading = false;
          return reject();
        });
    });
  }

  getPostType() {
    const key = this.controls.postType.items[this.controls.postType.selectedIndex];

    switch(key.toLowerCase()) {
      case 'images':
        return 'image';

      case 'videos':
        return 'video';

      case 'pages':
        return 'page';

      case 'polls':
        return 'poll';

      default:
        return key;
    }
  }

  getSortBy() {
    switch(this.controls.sortBy.items[this.controls.sortBy.selectedIndex].toLowerCase()) {
      case 'total points':
        return 'points';

      case 'date posted':
        return 'date';

      case '# of comments':
        return 'comment_count';

      default:
        return 'points';
    }
  }

  getStatType() {
    const key = this.controls.statType.items[this.controls.statType.selectedIndex];

    switch(key.toLowerCase()) {
      case 'global':
        return 'global';
        
      case 'local':
        return 'local';

      case 'branch':
        return 'individual';

      default:
        return key;
    }
  }

  // compute the appropriate timeafter for the selected time filter
  getTimeafter() {
    switch(this.controls.timeRange.items[this.controls.timeRange.selectedIndex].toLowerCase()) {
      case 'past year':
        return new Date().setFullYear(new Date().getFullYear() - 1);

      case 'past month':
        return new Date().setMonth(new Date().getMonth() - 1);

      case 'past week':
        return new Date().setDate(new Date().getDate() - 7);

      case 'past 24 hrs':
        return new Date().setDate(new Date().getDate() - 1);

      case 'past hour':
        return new Date().setHours(new Date().getHours() - 1);

      case 'all time':
      default:
        return 0;
    }
  }
}

BranchWallController.$inject = [
  '$rootScope',
  '$scope',
  '$state',
  '$timeout',
  'AlertsService',
  'AppService',
  'BranchService',
  'EventService',
  'LocalStorageService',
  'WallService',
];

export default BranchWallController;
