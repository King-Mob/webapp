import Injectable from 'utils/injectable';

class BranchNucleusModtoolsController extends Injectable {
  constructor(...injections) {
    super(BranchNucleusModtoolsController.$inject, injections);

    const cache = this.LocalStorageService.getObject('cache').modLog || {};

    this.isLoading = true;
    this.log = cache[this.BranchService.branch.id] || [];

    this.getLog = this.getLog.bind(this);

    const listeners = [];
    listeners.push(this.EventService.on(this.EventService.events.CHANGE_BRANCH, this.getLog));
    this.$scope.$on('$destroy', () => listeners.forEach(deregisterListener => deregisterListener()));
  }

  getLog() {
    this.BranchService.getModLog(this.BranchService.branch.id)
      .then(log => this.$timeout(() => {
        this.log = log;
        this.isLoading = false;

        let cache = this.LocalStorageService.getObject('cache');
        cache.modLog = cache.modLog || {};
        cache.modLog[this.BranchService.branch.id] = this.log;
        this.LocalStorageService.setObject('cache', cache);
      }))
      .catch(() => {
        this.AlertsService.push('error', 'Error fetching moderator action log.');
        this.isLoading = false;
      });
  }

  getRemovableMods() {
    // a list of mods to be removed
    // can include self if other mods are present, and
    // removeable others must be added after self
    const removableMods = [];

    let me;
    
    for (let i = 0; i < this.BranchService.branch.mods.length; i += 1) {
      const mod = this.BranchService.branch.mods[i];
      if (mod.username === this.UserService.user.username) {
        me = mod;
        break;
      }
    }

    for (let i = 0; i < this.BranchService.branch.mods.length; i += 1) {
      const mod = this.BranchService.branch.mods[i];
      if ((mod.username === me.username && this.BranchService.branch.mods.length > 1) ||
        mod.date > me.date) {
        removableMods.push(mod);
      }
    }

    return removableMods;
  }

  handleClick(option) {
    let errMsg;
    let name;
    let params = {};
    let successMsg;

    switch (option) {
      case 'branch-delete':
        errMsg = 'Error deleting branch.';
        name = 'DELETE_BRANCH';
        successMsg = 'Successfully deleted branch.';
        break;

      case 'branch-request':
        errMsg = 'Error submitting child branch request.';
        name = 'SUBMIT_SUBBRANCH_REQUEST';
        params = {
          branchid: this.BranchService.branch.id,
        };
        successMsg = 'Successfully submitted child branch request.';
        break;

      case 'branch-review':
        errMsg = 'Error responding to child branch request.';
        name = 'REVIEW_SUBBRANCH_REQUESTS';
        params = {
          branchid: this.BranchService.branch.id,
        };
        successMsg = 'Successfully responded to child branch request.';
        break;

      case 'homepage-stats':
        errMsg = 'Error updating homepage stats.';
        name = 'UPDATE_HOMEPAGE_STATS';
        successMsg = 'Successfully updated homepage stats.';
        break;

      case 'mod-add':
        errMsg = 'Error updating moderator settings.';
        name = 'ADD_MOD';
        params = {
          branchid: this.BranchService.branch.id,
        };
        successMsg = 'Successfully updated moderator settings.';
        break;

      case 'mod-delete':
        errMsg = 'Error updating moderator settings.';
        name = 'REMOVE_MOD';
        params = {
          branchid: this.BranchService.branch.id,
          mods: this.getRemovableMods(),
        };
        successMsg = 'Successfully updated moderator settings.';
        break;

      default:
        // statements_def
        break;
    }

    if (name) {
      this.ModalService.open(name, params, successMsg, errMsg);
    }
  }
}

BranchNucleusModtoolsController.$inject = [
  '$scope',
  '$timeout',
  'AlertsService',
  'BranchService',
  'EventService',
  'LocalStorageService',
  'ModalService',
  'UserService',
];

export default BranchNucleusModtoolsController;
