import Injectable from 'utils/injectable';
import NotificationTypes from 'components/notification/notification-types.config';

class ProfileNotificationsController extends Injectable {
  constructor (...injections) {
    super(ProfileNotificationsController.$inject, injections);

    this.isLoading = false;
    this.isLoadingMore = false;
    this.NotificationTypes = NotificationTypes;
    this.notifications = [];

    const init = _ => {
      if (this.$state.current.name.indexOf('weco.profile') === -1) return;
      this.getNotifications();
    };

    init();

    this.EventService.on(this.EventService.events.CHANGE_USER, init);

    this.EventService.on(this.EventService.events.SCROLLED_TO_BOTTOM, name => {
      if ('NotificationsScrollToBottom' !== name) return;
      
      if (!this.isLoadingMore) {
        this.isLoadingMore = true;
        
        if (this.notifications.length) {
          this.getNotifications(this.notifications[this.notifications.length - 1].id);
        }
      }
    });
  }

  getNotificationImageType (notification) {
    switch(notification.type) {
      case NotificationTypes.NEW_CHILD_BRANCH_REQUEST:
      case NotificationTypes.CHILD_BRANCH_REQUEST_ANSWERED:
      case NotificationTypes.BRANCH_MOVED:
        return 'branch';

      case NotificationTypes.MODERATOR:
        return 'moderator';

      case NotificationTypes.COMMENT:
        return 'comment';

      case NotificationTypes.POST_FLAGGED:
      case NotificationTypes.POST_REMOVED:
      case NotificationTypes.POST_TYPE_CHANGED:
        return 'flagged';

      default:
        return 'user';
    }
  }

  getNotifications (lastNotificationId) {
    this.isLoading = true;

    this.UserService.getNotifications(this.$state.params.username, false, lastNotificationId)
      .then( notifications => {
        this.$timeout( _ => {
          this.notifications = lastNotificationId ? this.notifications.concat(notifications) : notifications;
          this.isLoading = false;
          this.isLoadingMore = false;
        });
      })
      .catch( _ => this.AlertsService.push('error', 'Unable to fetch notifications.') );
  }

  toggleUnreadState (notification) {
    this.UserService.markNotification(this.UserService.user.username, notification.id, !notification.unread)
      .then( _ => {
        this.EventService.emit('UNREAD_NOTIFICATION_CHANGE', !notification.unread ? 1 : -1);
        this.$timeout( _ => notification.unread = !notification.unread );
      })
      .catch( _ => this.AlertsService.push('error', 'Unable to mark notification.') );
  }
}

ProfileNotificationsController.$inject = [
  '$state',
  '$timeout',
  'AlertsService',
  'EventService',
  'UserService'
];

export default ProfileNotificationsController;