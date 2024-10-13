import React, { useState, useEffect, } from 'react'
import client, { databases } from '../appwriteConfig'
import { ID, Query, Role, Permission } from 'appwrite';
import {Trash2} from 'react-feather'
import Header from '../components/Header';
import { useAuth } from '../utils/AuthContext';
import conf from '../conf/conf';

const Room = () => {

    const {user} = useAuth()

    const [messages, setMessages] = useState([]);
    const [messageBody, setMessageBody] = useState('')

    useEffect(() => {
        getMessages();

        const unsubscribe = client.subscribe(`databases.${conf.appwriteDatabaseId}.collections.${conf.appwriteCollectionId}.documents`, response => {

            if(response.events.includes("databases.*.collections.*.documents.*.create")){
                console.log('A message was created')
                setMessages(prev => [response.payload, ...prev])
            }

            if(response.events.includes("databases.*.collections.*.documents.*.delete")){
                console.log('A message was deleted')
                setMessages(prev => prev.filter(message => message.$id !== response.payload.$id))
            }
        });

        return () => {
            unsubscribe()
        }

    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()

        let payload = {
            user_id : user.$id, 
            username: user.name,
            body:messageBody
        }
        
        let permissions = [
            Permission.write(Role.user(user.$id))
        ]

        let response = await databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            ID.unique(),
            payload,
            permissions,
        )

        console.log('Created', response)

        // setMessages(prev => [response, ...messages])

        setMessageBody('')
    }

    const getMessages = async () => {
        const response = await databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            [
                Query.orderDesc('$createdAt'), //remove this for ascending order of messages
                Query.limit(20)
            ] 
        )
        console.log('Response: ', response);
        setMessages(response.documents)
    }

    const deleteMessage = async (message_id) => {
        databases.deleteDocument(conf.appwriteDatabaseId, conf.appwriteCollectionId, message_id)
        //setMessages(prev => messages.filter(message => message.$id !== message_id))
    }

  return (
    <main className='container'>
        <div className='room--container'>
            <Header/>

            <form id='message--form' onSubmit={handleSubmit}>
                <div>
                    <textarea 
                    required
                    maxLength="1000"
                    placeholder='Say something...'
                    onChange={(e) => {setMessageBody(e.target.value)}}
                    value={messageBody}
                    ></textarea>
                </div>

                <div className='send-btn--wrapper'>
                    <input className='btn btn--secondary' type="submit" value="Send" />
                </div>
            </form>

            <div>
                {messages.map(message => (
                    <div key={message.$id} className='messages--wrapper'>
                        <div className='message-header'>
                            <p>
                                {message?.username ? (
                                    <span>{message.username}</span>
                                ) : (
                                    <span>Anonymous</span>
                                )}
                            </p>

                            <small className='message-timestamp'>{new Date(message.$createdAt).toLocaleString()}</small>
                            
                            {message.$permissions.includes(`delete(\"user:${user.$id}\")`) && (
                                <Trash2 
                                    className='delete--btn'
                                    onClick={() => {deleteMessage(message.$id)}}
                                />
                            )}
                        </div>
                        <div className='message--body'>
                            <span>
                                {message.body}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </main>
  )
}

export default Room