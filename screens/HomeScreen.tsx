import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import MapView, { MapPressEvent, Marker } from "react-native-maps";

type ReminderLocation = {
  latitude: number;
  longitude: number;
};

type Reminder = {
  id: string;
  text: string;
  location: ReminderLocation;
};

const REMINDERS_STORAGE_KEY = "svrati-reminders";

export default function HomeScreen() {
  const mapRef = useRef<MapView | null>(null);

  const [selectedLocation, setSelectedLocation] =
    useState<ReminderLocation | null>(null);

  const [userLocation, setUserLocation] = useState<ReminderLocation | null>(
    null,
  );

  const [locationError, setLocationError] = useState("");

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reminderText, setReminderText] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    loadSavedReminders();
    getUserLocation();
  }, []);

  const loadSavedReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);

      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }
    } catch (error) {
      console.log("Failed to load reminders:", error);
    }
  };

  const saveRemindersToStorage = async (updatedReminders: Reminder[]) => {
    try {
      await AsyncStorage.setItem(
        REMINDERS_STORAGE_KEY,
        JSON.stringify(updatedReminders),
      );
    } catch (error) {
      console.log("Failed to save reminders:", error);
    }
  };

  const getUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setLocationError("Location permission was denied.");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});

    const currentLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    setUserLocation(currentLocation);

    mapRef.current?.animateToRegion(
      {
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000,
    );
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setSelectedLocation({
      latitude,
      longitude,
    });

    setIsModalVisible(true);
  };

  const handleSaveReminder = () => {
    if (!selectedLocation || reminderText.trim() === "") {
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      text: reminderText.trim(),
      location: selectedLocation,
    };

    const updatedReminders = [...reminders, newReminder];

    setReminders(updatedReminders);
    saveRemindersToStorage(updatedReminders);

    setReminderText("");
    setIsModalVisible(false);
  };

  const handleDeleteReminder = (id: string) => {
    const updatedReminders = reminders.filter((reminder) => reminder.id !== id);

    setReminders(updatedReminders);
    saveRemindersToStorage(updatedReminders);
  };

  const focusReminderOnMap = (location: ReminderLocation) => {
    mapRef.current?.animateToRegion(
      {
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000,
    );
  };

  const centerMapOnUserLocation = () => {
    if (!userLocation) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000,
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 44.7866,
          longitude: 20.4489,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
      >
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
            description="Your current location"
            pinColor="green"
          />
        )}

        {reminders.map((reminder) => (
          <Marker
            key={reminder.id}
            coordinate={reminder.location}
            title={reminder.text}
            description="Saved reminder"
          />
        ))}

        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Selected location"
            description="This location is not saved yet"
            pinColor="blue"
          />
        )}
      </MapView>

      <View style={styles.header}>
        <Text style={styles.title}>Svrati</Text>

        <Text style={styles.subtitle}>
          Tap anywhere on the map to add a reminder
        </Text>

        {locationError ? (
          <Text style={styles.errorText}>{locationError}</Text>
        ) : null}
      </View>

      <Pressable
        style={styles.locationButton}
        onPress={centerMapOnUserLocation}
      >
        <Text style={styles.locationButtonText}>My location</Text>
      </Pressable>

      <View style={styles.remindersPanel}>
        <Text style={styles.panelTitle}>
          Saved reminders ({reminders.length})
        </Text>

        {reminders.length === 0 ? (
          <Text style={styles.emptyText}>
            No reminders yet. Tap the map to add one.
          </Text>
        ) : (
          <FlatList
            data={reminders}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={styles.reminderCard}
                onPress={() => focusReminderOnMap(item.location)}
              >
                <Text style={styles.reminderText}>{item.text}</Text>

                <Text style={styles.coordinatesText}>
                  {item.location.latitude.toFixed(4)},{" "}
                  {item.location.longitude.toFixed(4)}
                </Text>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteReminder(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </Pressable>
            )}
          />
        )}
      </View>

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Why do you want to come here?</Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Buy coffee, visit shop..."
              placeholderTextColor="#94A3B8"
              value={reminderText}
              onChangeText={setReminderText}
            />

            <Pressable style={styles.saveButton} onPress={handleSaveReminder}>
              <Text style={styles.saveButtonText}>Save Reminder</Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  header: {
    position: "absolute",
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    padding: 20,
    borderRadius: 20,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },

  subtitle: {
    color: "#CBD5E1",
    fontSize: 15,
  },

  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    marginTop: 8,
  },

  locationButton: {
    position: "absolute",
    right: 20,
    top: 185,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
  },

  locationButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },

  remindersPanel: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 28,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 16,
    borderRadius: 22,
  },

  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },

  emptyText: {
    fontSize: 14,
    color: "#64748B",
  },

  reminderCard: {
    width: 200,
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 16,
    marginRight: 12,
  },

  reminderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },

  coordinatesText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 14,
  },

  deleteButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 16,
  },

  saveButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
});
