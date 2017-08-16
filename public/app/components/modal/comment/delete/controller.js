import Injectable from 'utils/injectable';

class DeleteCommentModalController extends Injectable {
  constructor (...injections) {
    super(DeleteCommentModalController.$inject, injections);

    this.handleModalCancel = this.handleModalCancel.bind(this);
    this.handleModalSubmit = this.handleModalSubmit.bind(this);

    this.errorMessage = '';
    this.isLoading = false;

    const listeners = [];
    listeners.push(this.EventService.on(this.EventService.events.MODAL_CANCEL, this.handleModalCancel));
    listeners.push(this.EventService.on(this.EventService.events.MODAL_OK, this.handleModalSubmit));
    this.$scope.$on('$destroy', () => listeners.forEach(deregisterListener => deregisterListener()));
  }

  handleModalCancel(name) {
    if (name !== 'DELETE_COMMENT') return;
      
    this.$timeout( () => {
      this.errorMessage = '';
      this.isLoading = false;
      this.ModalService.Cancel();
    });
  }

  handleModalSubmit(name) {
    if (name !== 'DELETE_COMMENT') return;

    const params = this.ModalService.inputArgs;
    
    this.isLoading = true;

    this.CommentService.delete(params.postid, params.commentid)
      .then(() => {
        this.isLoading = false;
        this.ModalService.OK();
      })
      .catch(() => {
        this.isLoading = false;
        this.ModalService.Cancel();
      });
  }
}

DeleteCommentModalController.$inject = [
  '$scope',
  '$timeout',
  'AlertsService',
  'CommentService',
  'EventService',
  'ModalService',
];

export default DeleteCommentModalController;