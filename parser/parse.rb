require 'csv'
require 'json'

class Parse
  def initialize
    @data = {}
    @data["nodes"] = []
    @data["links"] = []
  end

  def parse_for(doctor="all_doctors")
    CSV.foreach("../data/DataForVanessa.csv") do |row|
      if (row[0] == doctor || doctor == "all_doctors") && row[0] != row[3]
        node_sender = @data["nodes"].detect { |node| node["name"] == row[0] }
        node_receiver = @data["nodes"].detect { |node| node["name"] == row[3] }

        if node_sender
          node_sender["total_referrals"] += 1
        else
          @data["nodes"] << {"name" => row[0], "practice" => row[1], "specialty" => row[2], "total_referrals" => 1}
        end

        if node_receiver
          node_receiver["total_referrals"] += 1
        else
          @data["nodes"] << {"name" => row[3], "practice" => row[4], "specialty" => row[5], "total_referrals" => 1}
        end

        unless @data["links"].any? { |link| link == { "source" => row[0], "target" => row[3] } }
          @data["links"] << { "source" => row[0], "target" => row[3] }
        end
      end
    end

    create_json_file(doctor)
  end

  def create_json_file(doctor)
    File.open("../data/#{doctor.split(" ").last.downcase}.json", 'w') do |file|
      file.puts JSON.pretty_generate(JSON.parse(@data.to_json))
    end
  end
end

Parse.new.parse_for("Howard Baruch")
Parse.new.parse_for("Christine Corradino")
Parse.new.parse_for("Mohammad Dorri")
Parse.new.parse_for("Danielle Groves")
Parse.new.parse_for("Danielle Zelnik")
Parse.new.parse_for("Iris Drey")
Parse.new.parse_for






