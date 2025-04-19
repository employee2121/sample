import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { Searchbar, Text, Avatar, Badge, ActivityIndicator, Divider } from 'react-native-paper';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

const ContactsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { contacts, loadContacts, connected, selectContact } = useSocket();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  
  // Load contacts when component mounts
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        await loadContacts();
      } catch (error) {
        console.error('Failed to load contacts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (connected) {
      fetchContacts();
    }
  }, [connected, loadContacts]);
  
  // Update filtered contacts when contacts or search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredContacts(contacts);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = contacts.filter(contact => 
      contact.name.toLowerCase().includes(query) || 
      contact.email.toLowerCase().includes(query)
    );
    
    setFilteredContacts(filtered);
  }, [contacts, searchQuery]);
  
  // Handle contact press
  const handleContactPress = (contact) => {
    selectContact(contact);
    navigation.navigate('ChatDetail', { 
      id: contact._id,
      name: contact.name
    });
  };
  
  // Render each contact item
  const renderContactItem = ({ item }) => {
    // Don't show current user in the list
    if (user && item._id === user._id) return null;
    
    const isOnline = item.status === 'online';
    
    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleContactPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Avatar.Text 
            size={50} 
            label={item.name.substring(0, 2).toUpperCase()} 
            backgroundColor={isOnline ? '#4CAF50' : '#9E9E9E'}
          />
          {isOnline && <Badge style={styles.statusBadge} />}
        </View>
        
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactEmail}>{item.email}</Text>
        </View>
        
        <View style={styles.contactActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Call', { 
              contactId: item._id,
              contactName: item.name,
              isVideo: false
            })}
          >
            <Ionicons name="call-outline" size={22} color="#4A90E2" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Call', { 
              contactId: item._id,
              contactName: item.name,
              isVideo: true
            })}
          >
            <Ionicons name="videocam-outline" size={22} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search contacts"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : (
        <>
          {filteredContacts.length > 0 ? (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item._id.toString()}
              renderItem={renderContactItem}
              ItemSeparatorComponent={() => <Divider />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No contacts found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search' : 'Your contacts will appear here'}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  searchbar: {
    margin: 10,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
  },
  contactActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  }
});

export default ContactsScreen;