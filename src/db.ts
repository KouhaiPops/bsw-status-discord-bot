import { DataTypes, Model, Sequelize } from "sequelize";
import { User } from "discord.js";
let sqliteStorage = "./database.db";
let logging = false;

if (process.env.DEV_BUILD)
{
    sqliteStorage = ":memory:"
    logging = false;
}

interface MessageAttributes {
    id? : number,
    messageId : string,
    channelId : string,
    guildId : string,
    roleId? : string,
}

interface UsersNotifiedAttributes {
    id? : number,
    userId : string
}

export class MessageDTO extends Model<MessageAttributes> implements MessageAttributes {
    id!: number;
    messageId!: string;
    channelId!: string;
    guildId!: string;
    roleId! : string;

}

export class UsersNotifiedDTO extends Model<UsersNotifiedAttributes> implements UsersNotifiedAttributes {
    id! : number;
    userId! : string;
}

const sequelize = new Sequelize('database', "", undefined, {
    dialect: 'sqlite',
    logging: logging,
    define: {
        timestamps: false
    },
    storage: sqliteStorage,
    pool: {
        idle: 10000
    }
});


MessageDTO.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        messageId: {
            type: new DataTypes.STRING(128),
            allowNull: false
        },
        channelId: {
            type: new DataTypes.STRING(128),
            allowNull: false
        },
        guildId: {
            type: new DataTypes.STRING(128),
            allowNull: false
        },
        roleId: {
            type: new DataTypes.STRING(128),
            allowNull: true,
        }
    },
    {
        tableName: "messages",
        sequelize,
    }
);

UsersNotifiedDTO.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.STRING(128),
            allowNull: false,
        }
    },
    {
        tableName: "notifiedUsers",
        sequelize,
    }
);

export function AddNotifiedUser(user : User | undefined) {
    if(user) {
        UsersNotifiedDTO.create({userId: user.id});
    }
}

// Create / update database if it doesn't exist
sequelize.sync();
