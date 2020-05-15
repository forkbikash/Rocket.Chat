import { Meteor } from 'meteor/meteor';
import { ISettingsBase } from "/app/settings/lib/settings";
import { IUsersRepository } from '../../models/lib';
import { IUser } from '../../../definition/IUser';
import { IAuthorization } from '../../authorization/lib/IAuthorizationUtils';
import { IRoomsRepository } from '../../models/lib/IRoomsRepository';
import { ISubscriptionRepository } from '../../models/lib/ISubscriptionRepository';

export enum RoomSettingsEnum {
    TYPE = 'type',
    NAME = 'roomName',
    TOPIC = 'roomTopic',
    ANNOUNCEMENT = 'roomAnnouncement',
    DESCRIPTION = 'roomDescription',
    READ_ONLY = 'readOnly',
    REACT_WHEN_READ_ONLY = 'reactWhenReadOnly',
    ARCHIVE_OR_UNARCHIVE = 'archiveOrUnarchive',
    JOIN_CODE = 'joinCode',
    BROADCAST = 'broadcast',
    SYSTEM_MESSAGES = 'systemMessages',
    E2E = 'encrypted',
};

export const RoomMemberActions = {
    ARCHIVE: 'archive',
    IGNORE: 'ignore',
    BLOCK: 'block',
    MUTE: 'mute',
    SET_AS_OWNER: 'setAsOwner',
    SET_AS_LEADER: 'setAsLeader',
    SET_AS_MODERATOR: 'setAsModerator',
    LEAVE: 'leave',
    REMOVE_USER: 'removeUser',
    JOIN: 'join',
    INVITE: 'invite',
};

export const UiTextContext = {
    CLOSE_WARNING: 'closeWarning',
    HIDE_WARNING: 'hideWarning',
    LEAVE_WARNING: 'leaveWarning',
    NO_ROOMS_SUBSCRIBED: 'noRoomsSubscribed',
};

interface IRoomTypeRouteConfigObject {
    name: string;
    path: string;
};

interface IRoomTypeConfigObject {
    identifier: string;
    order: number;
    label?: string;
    route?: IRoomTypeRouteConfig;
    icon?: string;
    header?: string;
}

export interface IRoomTypeConfig extends IRoomTypeConfigObject {
    allowMemberAction(room: any, action: string): boolean;
    allowRoomSettingChange(room: any, setting: string): boolean;
    canAccessUploadedFile(accessData: any): boolean;
    canAddUser(room: any): boolean;
    canBeCreated(): boolean;
    canBeDeleted(room: any): boolean;
    canSendMessage(roomId: string): boolean;
    condition(): boolean;
    enableMembersListProfile(): boolean;
    findRoom(identifier: string): any
    includeInDashboard(): boolean;
    includeInRoomSearch(): boolean;
    isEmitAllowed(): boolean;
    isGroupChat(room?: any): boolean;
    getAvatarPath(roomData: any, subData?: any): string;
    getDiscussionType(): string;
    getIcon(roomData: any): string | undefined;
    getMsgSender(senderId: string): IUser | {};
    getNotificationDetails(room: any, user: IUser, notificationMessage: string): any;
    getUiText(context: string): string;
    getReadReceiptsExtraData(message: any): any;
    getUserStatus(roomId: string): string;
    getUserStatusText(roomId: string): string;
    openCustomProfileTab(instance: any, room: any, username: string): boolean;
    preventRenaming(/* room */): boolean;
    roomName(room: any): string;
    secondaryRoomName(room: any): string;
    supportMembersList(/* room */): boolean;
    userDetailShowAdmin(/* room */): boolean;
    userDetailShowAll(/* room */): boolean;
}

export interface IRoomTypeRouteConfig extends IRoomTypeRouteConfigObject {
    action(params: any): Promise<any>;
    link?(params: any): { [key: string]: string };
}

export abstract class RoomTypeRouteConfig {
    protected _name: string;
    protected readonly _path: string;

    protected constructor({ name, path }: IRoomTypeRouteConfigObject) {
        this._name = name;
        this._path = path;
    }

    get name(): string {
        return this._name;
    }

    get path(): string {
        return this._path;
    }
}

export abstract class RoomTypeConfig {
    protected readonly _identifier: string;
    protected _order: number;
    protected readonly _icon: string | undefined;
    protected readonly _header: string | undefined;
    protected readonly _label:  string | undefined;
    protected readonly _route: IRoomTypeRouteConfig | undefined;
    protected readonly settings: ISettingsBase;
    protected readonly Users: IUsersRepository;
    protected readonly Rooms: IRoomsRepository;
    protected readonly Subscriptions: ISubscriptionRepository;
    protected readonly AuthorizationUtils: IAuthorization;

    protected constructor({
                              identifier,
                              order,
                              icon,
                              header,
                              label,
                              route,
                          }: IRoomTypeConfigObject,
                          settings: ISettingsBase,
                          Users: IUsersRepository,
                          Rooms: IRoomsRepository,
                          Subscriptions: ISubscriptionRepository,
                          AuthorizationUtils: IAuthorization) {

        this._identifier = identifier;
        this._order = order;
        this._icon = icon;
        this._header = header;
        this._label = label;
        this._route = route;
        this.settings = settings;
        this.Users = Users;
        this.Rooms = Rooms;
        this.Subscriptions = Subscriptions;
        this.AuthorizationUtils = AuthorizationUtils;
    }

    /**
     * The room type's internal identifier.
     */
    get identifier(): string {
        return this._identifier;
    }

    /**
     * The order of this room type for the display.
     */
    get order(): number {
        return this._order;
    }

    /**
     * Sets the order of this room type for the display.
     *
     * @param {number} order the number value for the order
     */
    set order(order: number) {
        this._order = order;
    }

    /**
     * The icon class, css, to use as the visual aid.
     */
    get icon(): string | undefined {
        return this._icon;
    }

    /**
     * The header name of this type.
     */
    get header(): string | undefined {
        return this._header;
    }

    /**
     * The i18n label for this room type.
     */
    get label(): string | undefined {
        return this._label;
    }

    /**
     * The route config for this room type.
     */
    get route(): IRoomTypeRouteConfig | undefined{
        return this._route;
    }

    allowMemberAction(room: any, action: string): boolean {
        return false;
    }

    allowRoomSettingChange(room: any, setting: string): boolean {
        return true;
    }

    /**
     * Check if there is an user with the same id and loginToken
     * @param {object} allowData
     * @return {object} User's object from db
     */
    canAccessUploadedFile(accessData: any): boolean {
        return false;
    }

    canAddUser(room: any): boolean {
        return false;
    }

    canBeCreated(): boolean {
        return this.AuthorizationUtils.hasPermission(Meteor.userId() as string, `create-${ this._identifier }`);
    }

    canBeDeleted(room: any): boolean {
        return this.AuthorizationUtils.hasPermission(Meteor.userId() as string, `delete-${ room.t }`, room._id);
    }

    canSendMessage(rid: string): boolean {
        return this.Subscriptions.find({ rid }).count() > 0;
    }

    enableMembersListProfile(): boolean {
        return false;
    }

    findRoom(identifier: string): any {
        return this.Rooms.findOne({ _id: identifier });
    }

    getAvatarPath(roomData: any, subData: any): string {
        return '';
    }

    getDiscussionType(): string {
        return 'p';
    }

    getIcon(roomData: any): string | undefined {
        return this.icon;
    }

    /**
     * Returns the full object of message sender
     * @param {string} senderId Sender's _id
     * @return {object} Sender's object from db
     */
    getMsgSender(senderId: string): IUser | {} {
        if (Meteor.isServer) {
            return this.Users.findOneById(senderId);
        }
        return {};
    }

    /**
     * Returns details to use on notifications
     *
     * @param {object} room
     * @param {object} user
     * @param {string} notificationMessage
     * @return {object} Notification details
     */
    getNotificationDetails(room: any, user: IUser, notificationMessage: string): any {
        if (!Meteor.isServer) {
            return {};
        }

        const title = `#${ this.roomName(room) }`;

        const text = `${ this.settings.get('UI_Use_Real_Name') ? user.name : user.username }: ${ notificationMessage }`;

        return { title, text };
    }

    getReadReceiptsExtraData(message: any): any {
        return {};
    }

    /**
     * Returns a text which can be used in generic UIs.
     * @param context The role of the text in the UI-Element
     * @return {string} A text or a translation key - the consumers of this method will pass the
     * returned value to an internationalization library
     */
    getUiText(context: string): string {
        return '';
    }

    getUserStatus(roomId: string): string {
        return '';
    }

    getUserStatusText(roomId: string): string {
        return '';
    }

    includeInDashboard(): boolean {
        return false;
    }

    includeInRoomSearch(): boolean {
        return false;
    }

    isGroupChat(): boolean {
        return false;
    }

    isEmitAllowed(): boolean {
        return false;
    }

    openCustomProfileTab(instance: any, room: any, username: string): boolean {
        return false;
    }

    preventRenaming(/* room */): boolean {
        return false;
    }

    /**
     * Return a room's name
     *
     * @return {string} Room's name according to it's type
     */
    roomName(room: any): string {
        return room && (room.fname || room.name);
    }

    secondaryRoomName(room: any): string {
        return room && (room.fname || room.name);
    }

    supportMembersList(/* room */): boolean {
        return true;
    }

    userDetailShowAll(/* room */): boolean {
        return true;
    }

    userDetailShowAdmin(/* room */): boolean {
        return true;
    }
}