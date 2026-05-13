import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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

export default function HomeScreen() {
  const [selectedLocation, setSelectedLocation] =
    useState<ReminderLocation | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reminderText, setReminderText] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);

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

    setReminders((currentReminders) => [...currentReminders, newReminder]);

    setReminderText("");
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 44.7866,
          longitude: 20.4489,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
      >
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
      </View>

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
              <View style={styles.reminderCard}>
                <Text style={styles.reminderText}>{item.text}</Text>
                <Text style={styles.coordinatesText}>
                  {item.location.latitude.toFixed(4)},{" "}
                  {item.location.longitude.toFixed(4)}
                </Text>
              </View>
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
    width: 180,
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
